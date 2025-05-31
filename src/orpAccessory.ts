import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';

export class OrpAccessory {
  private service: Service | null = null;
  private currentORP = 0;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;

    this.getORP().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

      // Use the custom ORP Sensor service
      this.service = this.accessory.getService((this.platform.Service as { ORP: Characteristic }).OrpSensor)
        || this.accessory.addService((this.platform.Service as { ORP: Characteristic }).OrpSensor, 'ORP Sensor');

      const OrpCharacteristic = (this.platform.Characteristic as { ORP: Characteristic }).ORP;
      this.service.getCharacteristic(OrpCharacteristic)
        .onGet(this.handleORPGet.bind(this));

      this.service.setCharacteristic(this.platform.Characteristic.Name, 'ORP');

      setInterval(() => {
        this.getORP().catch((error) => {
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
