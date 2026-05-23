import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP';
import { getMeasurementValue } from './measurements';

export class PoolAccessory {
  private service: Service | null = null;
  private loggingService: { addEntry: (entry: { temp: number; humidity: number; time: number; pressure: number }) => void };

  private currentTemperature = 25;
  private currentORP = 750;
  private currentPH = 0;
  private currentConductivity = 0;

  constructor(
        private readonly platform: BlueConnectPlatform,
        private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;
    this.loggingService = new this.platform.fakeGatoHistoryService('weather', this.accessory, { storage: 'fs' });

    this.getPoolData().then(() => {
            // set accessory information
            this.accessory.getService(this.platform.Service.AccessoryInformation)!
              .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
              .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
              .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
              .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

            this.service = this.accessory.getService(
              this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor,
            );

            this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.blue_device_serial);
            this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
              .onGet(this.handleCurrentTemperatureGet.bind(this));
            this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
              .onGet(this.handleCurrentPHGet.bind(this));
            this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
              .onGet(this.handleCurrentORPGet.bind(this));
            attachCustomORPCharacteristic(this.service, this.platform.api)
              .onGet(this.handleCurrentORPGet.bind(this));

            setInterval(() => {
              this.getPoolData().catch((error) => {
                this.platform.log.error('Error getting current pool data: ' + error);
              });
            }, 60000 * (this.platform.config.refreshInterval || 30) );
    });
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    if(this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentTemperature;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Handle requests to get the current value of the "Current PH" characteristic
   */
  async handleCurrentPHGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentPH * 10;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
     * Handle requests to get the current value of the "Current ORP" characteristic
     */
  async handleCurrentORPGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentORP;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getPoolData() {
    this.platform.log.debug(
      'Getting current temperature for ' +
        this.accessory.context.device.blue_device_serial +
        ' and pool ' +
        this.accessory.context.device.swimming_pool_id,
    );

    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );

      this.platform.log.debug('Last measurement: ' + lastMeasurementString);

      const lastMeasurement = JSON.parse(lastMeasurementString);

      if (!Array.isArray(lastMeasurement.data)) {
        this.platform.log.warn('Last measurement payload is missing data array, keeping previous values');

        return;
      }

      const measurements: Array<{ name: string; value: number }> = lastMeasurement.data;

      this.currentTemperature = getMeasurementValue(this.platform.log, measurements, 'temperature', this.currentTemperature);
      this.currentORP = getMeasurementValue(this.platform.log, measurements, 'orp', this.currentORP);
      this.currentPH = getMeasurementValue(this.platform.log, measurements, 'ph', this.currentPH);
      this.currentConductivity = getMeasurementValue(this.platform.log, measurements, 'conductivity', this.currentConductivity);

      this.loggingService.addEntry({
        time: Math.round(new Date().valueOf() / 1000),
        temp: this.currentTemperature,
        pressure: this.currentORP,
        humidity: this.currentPH * 10,
      });

      this.platform.log.debug('Current temperature: ' + this.currentTemperature);
      this.platform.log.debug('Current ORP: ' + this.currentORP);
      this.platform.log.debug('Current pH: ' + this.currentPH);
      this.platform.log.debug('Current conductivity: ' + this.currentConductivity);
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + error);
    }
  }
}
