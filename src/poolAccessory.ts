import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';



export class PoolAccessory {
  private service: Service | null = null;

  /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
  private currentTemperature = 25;

  constructor(
        private readonly platform: BlueConnectPlatform,
        private readonly accessory: PlatformAccessory,
  ) {
    this.getCurrentTemperature().then(() => {
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
            
            setInterval(() => {
              this.getCurrentTemperature().catch((error) => {
                this.platform.log.error('Error getting current temperature: ' + error);
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

  async getCurrentTemperature() {
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

      this.currentTemperature = lastMeasurement.data[0].value;

      this.platform.log.debug('Current temperature: ' + this.currentTemperature);
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + error);
    }
  }
}
