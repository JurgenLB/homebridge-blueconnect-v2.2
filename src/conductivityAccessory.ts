import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
// import { ConductivitySensorService, ConductivityCharacteristic } from './customCharacteristics';

export class ConductivityAccessory {
  private service: Service;
  private currentCONDUCTIVITY = 7;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;

    // Assign the service before using it
    this.service = this.accessory.getService(this.platform.Service.ConductivitySensor)
      || this.accessory.addService(this.platform.Service.ConductivitySensor, 'Conductivity Sensor');

    this.getCONDUCTIVITY().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);
      
      service.getCharacteristic(this.platform.Characteristic.Conductivity);

      this.service.setCharacteristic(this.platform.Characteristic.Name, 'Conductivity');

      setInterval(() => {
        this.getCONDUCTIVITY().catch((error) => {
          this.platform.log.error('Error getting CONDUCTIVITY: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    });
  }

  async handleCONDUCTIVITYGet(): Promise<CharacteristicValue> {
    return this.currentCONDUCTIVITY;
  }

  async getCONDUCTIVITY() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentCONDUCTIVITY = lastMeasurement.data.find((element: { name: string }) => element.name === 'conductivity')?.value ?? 0;
      this.platform.log.debug(`Current conductivity: ${this.currentCONDUCTIVITY}`);
    } catch (error) {
      this.platform.log.error('Error getting CONDUCTIVITY: ' + error);
    }
  }
}
