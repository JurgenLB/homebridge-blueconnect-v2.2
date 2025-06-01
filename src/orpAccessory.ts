import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { OrpSensorService, OrpCharacteristic } from './customCharacteristics';

export class OrpAccessory {
  private service: Service;
  private currentORP = 0;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;

    this.service = this.accessory.services.find(s => s.displayName === 'ORP') as Service ||
      (this.accessory.addService(new (OrpSensorService as any)('ORP')) as Service);

    // Make sure the custom pH characteristic is present
    if (!this.service.testCharacteristic(OrpCharacteristic)) {
      this.service.addCharacteristic(OrpCharacteristic);
    }

    this.getORP().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

      // Set the characteristic value
      this.service
        .getCharacteristic(OrpCharacteristic)
        .onGet(this.handlePHGet.bind(this))
        .updateValue(this.currentORP);

      this.service.setCharacteristic(this.platform.Characteristic.Name, 'ORP');

      setInterval(() => {
        this.getORP().then(() => {
          this.service.updateCharacteristic(OrpCharacteristic, this.currentORP);
        }).catch((error) => {
          this.platform.log.error('Error getting ORP: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    });
  }

  async handleORPGet(): Promise<CharacteristicValue> {
    return this.currentORP;
  }

  async getORP() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentORP = lastMeasurement.data.find((element: { name: string }) => element.name === 'orp')?.value ?? 0;
      this.platform.log.debug(`Current ORP: ${this.currentORP}`);
    } catch (error) {
      this.platform.log.error('Error getting ORP: ' + error);
    }
  }
}
