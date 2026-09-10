import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { getCustomCharacteristics } from './characteristics/customHomeKitTypes.js';

export class PoolAccessory {
  private service: Service | null = null;
  private loggingService: { addEntry: (entry: { temp: number; humidity: number; time: number; pressure: number }) => void };

  private currentTemperature = 25;
  private currentORP = 750;
  private currentPH = 7;
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

            // Attach custom characteristics for PH, ORP and Conductivity.
            // Use getCharacteristic(UUID) first to avoid the duplicate-UUID error
            // that occurs when a cached accessory already has the characteristic.
            const { PH, ORP, Conductivity } = getCustomCharacteristics(this.platform.api);

            const phChar = this.service.getCharacteristic(PH.UUID) ?? this.service.addCharacteristic(PH);
            phChar.onGet(this.handleCurrentPHGet.bind(this));

            const orpChar = this.service.getCharacteristic(ORP.UUID) ?? this.service.addCharacteristic(ORP);
            orpChar.onGet(this.handleCurrentORPGet.bind(this));

            const conductivityChar = this.service.getCharacteristic(Conductivity.UUID) ?? this.service.addCharacteristic(Conductivity);
            conductivityChar.onGet(this.handleCurrentConductivityGet.bind(this));

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
   * Handle requests to get the current value of the custom PH characteristic
   */
  async handleCurrentPHGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentPH;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Handle requests to get the current value of the custom ORP characteristic
   */
  async handleCurrentORPGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentORP;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Handle requests to get the current value of the custom Conductivity characteristic
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

      const conductivityEntry = lastMeasurement.data.find((element: { name: string }) => element.name === 'conductivity');
      this.currentConductivity = conductivityEntry ? conductivityEntry.value : 0;

      this.loggingService.addEntry({
        time: Math.round(new Date().valueOf() / 1000),
        temp: this.currentTemperature,
        pressure: this.currentORP,
        humidity: this.currentPH,
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
