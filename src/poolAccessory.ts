import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP';
import { attachCustomPHCharacteristic } from './characteristics/PH';
import { attachCustomConductivityCharacteristic } from './characteristics/Conductivity';

const GUIDANCE_LANGUAGE = 'en';

export class PoolAccessory {
  private temperatureService: Service | null = null;
  private phService: Service | null = null;
  private orpService: Service | null = null;
  private conductivityService: Service | null = null;
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

            this.temperatureService = this.accessory.getService(
              this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor,
            );

            this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.blue_device_serial);
            this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
              .onGet(this.handleCurrentTemperatureGet.bind(this));

            this.phService = this.accessory.getServiceById(this.platform.Service.AirQualitySensor, 'ph') ||
              this.accessory.addService(this.platform.Service.AirQualitySensor, 'pH', 'ph');
            attachCustomPHCharacteristic(this.phService, this.platform.api, accessory.context.device.blue_device_serial)
              .onGet(this.handleCurrentPHGet.bind(this));

            this.orpService = this.accessory.getServiceById(this.platform.Service.AirQualitySensor, 'orp') ||
              this.accessory.addService(this.platform.Service.AirQualitySensor, 'ORP', 'orp');
            attachCustomORPCharacteristic(this.orpService, this.platform.api, accessory.context.device.blue_device_serial)
              .onGet(this.handleCurrentORPGet.bind(this));

            this.conductivityService = this.accessory.getServiceById(this.platform.Service.AirQualitySensor, 'conductivity') ||
              this.accessory.addService(this.platform.Service.AirQualitySensor, 'Conductivity', 'conductivity');
            attachCustomConductivityCharacteristic(this.conductivityService, this.platform.api, accessory.context.device.blue_device_serial)
              .onGet(this.handleCurrentConductivityGet.bind(this));

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
      return this.currentPH;
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

  /**
     * Handle requests to get the current value of the "Current Conductivity" characteristic
     */
  async handleCurrentConductivityGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentConductivity;
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

      this.currentTemperature = lastMeasurement.data.find((element: { name: string }) => element.name === 'temperature').value;
      this.currentORP = lastMeasurement.data.find((element: { name: string }) => element.name === 'orp').value;
      this.currentPH = lastMeasurement.data.find((element: { name: string }) => element.name === 'ph').value;

      this.loggingService.addEntry({
        time: Math.round(new Date().valueOf() / 1000),
        temp: this.currentTemperature,
        pressure: this.currentORP,
        humidity: this.currentPH * 10,
      });

      this.platform.log.debug('Current temperature: ' + this.currentTemperature);
      this.platform.log.debug('Current ORP: ' + this.currentORP);
      this.platform.log.debug('Current pH: ' + this.currentPH);

      const guidanceString = await this.platform.blueRiotAPI.getGuidance(
        this.accessory.context.device.swimming_pool_id,
        GUIDANCE_LANGUAGE,
      );

      this.platform.log.debug('Guidance: ' + guidanceString);

      const guidance = JSON.parse(guidanceString);
      const conductivityEntry = guidance?.data?.find((element: { name: string }) => element.name === 'conductivity');

      if (conductivityEntry) {
        this.currentConductivity = conductivityEntry.value;
        this.platform.log.debug('Current conductivity: ' + this.currentConductivity);
      }
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + error);
    }
  }
}
