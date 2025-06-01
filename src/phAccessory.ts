import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PhSensorService, PhCharacteristic } from './customCharacteristics';

export class PhAccessory {
  private service: Service;
  private currentPH = 7;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;
    // Assign the service before using it
    this.service = this.accessory.services.find(s => s.displayName === 'pH') as Service ||
      (this.accessory.addService(new (PhSensorService as any)('pH')) as Service);

    // Make sure the custom pH characteristic is present
    if (!this.service.testCharacteristic(PhCharacteristic)) {
      this.service.addCharacteristic(PhCharacteristic);
    }
    
    this.getPH().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

      // Set the characteristic value
      this.service
        .getCharacteristic(PhCharacteristic)
        .onGet(this.handlePHGet.bind(this))
        .updateValue(this.currentPH);
      
      this.service.setCharacteristic(this.platform.Characteristic.Name, 'pH');

      setInterval(() => {
        this.getPH().then(() => {
          this.service.updateCharacteristic(PhCharacteristic, this.currentPH);
        }).catch((error) => {
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
