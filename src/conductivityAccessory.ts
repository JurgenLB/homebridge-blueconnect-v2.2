import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { ConductivitySensorService, ConductivityCharacteristic } from './customCharacteristics';

export class ConductivityAccessory {
  private service: Service;
  private currentCONDUCTIVITY = 7;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;

    // Assign the service before using it
    this.service = this.accessory.services.find(s => s.displayName === 'Conductivity') as Service ||
      (this.accessory.addService(new (ConductivitySensorService as any)('Conductivity')) as Service);

    // Make sure the custom pH characteristic is present
    if (!this.service.testCharacteristic(ConductivityCharacteristic)) {
      this.service.addCharacteristic(ConductivityCharacteristic);
    }

    this.getCONDUCTIVITY().then(() => {
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);
      
      // Set the characteristic value
      this.service
        .getCharacteristic(ConductivityCharacteristic)
        .onGet(this.handleConductivityGet.bind(this))
        .updateValue(this.currentCONDUCTIVITY);
  
      this.service.setCharacteristic(this.platform.Characteristic.Name, 'Conductivity');

      setInterval(() => {
        this.getCONDUCTIVITY().then(() => {
          this.service.updateCharacteristic(ConductivityCharacteristic, this.currentCONDUCTIVITY);
        }).catch((error) => {
          this.platform.log.error('Error getting CONDUCTIVITY: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    });
  }

  async handleConductivityGet(): Promise<CharacteristicValue> {
    return this.currentCONDUCTIVITY;
  }

  async getCONDUCTIVITY() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentCONDUCTIVITY = lastMeasurement.data.find((element: { name: string }) => element.name === 'Conductivity')?.value ?? 0;
      this.platform.log.debug(`Current conductivity: ${this.currentCONDUCTIVITY}`);
    } catch (error) {
      this.platform.log.error('Error getting CONDUCTIVITY: ' + error);
    }
  }
}
