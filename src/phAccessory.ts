import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';

export class PhAccessory {
  private service: Service | null = null;
  private currentPH = 7;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;
    // Assign the service before using it
    this.service = this.accessory.getService(this.platform.Service.PhSensor)
        || this.accessory.addService(this.platform.Service.PhSensor, 'Ph');


    this.getPH().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

      service.getCharacteristic(this.platform.Characteristic.Ph);

      this.service.setCharacteristic(this.platform.Characteristic.Name, 'pH');

      setInterval(() => {
        this.getPH().catch((error) => {
          this.platform.log.error('Error getting pH: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    });
  }

  async handlePHGet(): Promise<CharacteristicValue> {
    return this.currentPH;
  }

  async getPH() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentPH = lastMeasurement.data.find((element: { name: string }) => element.name === 'ph')?.value ?? 0;
      this.platform.log.debug(`Current pH: ${this.currentPH}`);
    } catch (error) {
      this.platform.log.error('Error getting pH: ' + error);
    }
  }
}
