import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { createCustomCharacteristicsAndServices } from './customCharacteristics';

export class BlueConnectAccessory {
  public currentCONDUCTIVITY = 0;
  public currentPH = 0;
  public currentORP = 0;

  public conductivityService: Service;
  public orpService: Service;
  public phService: Service;

  constructor(
    public readonly platform: BlueConnectPlatform,
    public readonly accessory: PlatformAccessory,
  ) {
    const blueDevice = this.accessory.context.device;

    const {
      ConductivityCharacteristic,
      ConductivitySensorService,
      OrpCharacteristic,
      OrpSensorService,
      PhCharacteristic,
      PhSensorService,
    } = createCustomCharacteristicsAndServices(this.platform.api, blueDevice);

    // Store characteristic classes for later use
    this.ConductivityCharacteristic = ConductivityCharacteristic;
    this.PhCharacteristic = PhCharacteristic;
    this.OrpCharacteristic = OrpCharacteristic;

    // Accessory Information (optional but recommended)
    this.accessory.getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'BlueRiiot')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, blueDevice.blue_device_serial)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

    // Characteristic Handlers
    // Conductivity
    this.conductivityService = this.accessory.addService(
      ConductivitySensorService,
      'Conductivity',
      'conductivity-service',
    ) as Service;
    this.conductivityService.getCharacteristic(ConductivityCharacteristic)
      .onGet(this.handleConductivityGet.bind(this));

    // pH
    this.phService = this.accessory.addService(
      PhSensorService,
      'pH',
      'ph-service',
    ) as Service;
    this.phService.getCharacteristic(PhCharacteristic)
      .onGet(this.handlePhGet.bind(this));

    // ORP
    this.orpService = this.accessory.addService(
      OrpSensorService,
      'ORP',
      'orp-service',
    ) as Service;
    this.orpService.getCharacteristic(OrpCharacteristic)
      .onGet(this.handleOrpGet.bind(this));

    // Initial data fetch (call periodically as needed)  60000 * (this.platform.config.refreshInterval || 30))
    this.updateAll();
    setInterval(() => this.updateAll(), 10 * 60 * 1000); // every 10 minutes 
  }

  async handleConductivityGet(): Promise<CharacteristicValue> {
    return this.currentCONDUCTIVITY;
  }

  async handlePhGet(): Promise<CharacteristicValue> {
    return this.currentPH;
  }

  async handleOrpGet(): Promise<CharacteristicValue> {
    return this.currentORP;
  }

  async updateAll() {
    await Promise.all([
      this.getCONDUCTIVITY(),
      this.getPH(),
      this.getORP(),
    ]);

    // update HomeKit with new values
    this.conductivityService.updateCharacteristic(this.ConductivityCharacteristic, this.currentCONDUCTIVITY);
    this.phService.updateCharacteristic(this.PhCharacteristic, this.currentPH);
    this.orpService.updateCharacteristic(this.OrpCharacteristic, this.currentORP);
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

  async getPH() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentPH = lastMeasurement.data.find((element: { name: string }) => element.name === 'pH')?.value ?? 0;
      this.platform.log.debug(`Current pH: ${this.currentPH}`);
    } catch (error) {
      this.platform.log.error('Error getting pH: ' + error);
    }
  }

  async getORP() {
    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );
      const lastMeasurement = JSON.parse(lastMeasurementString);
      this.currentORP = lastMeasurement.data.find((element: { name: string }) => element.name === 'ORP')?.value ?? 0;
      this.platform.log.debug(`Current ORP: ${this.currentORP}`);
    } catch (error) {
      this.platform.log.error('Error getting ORP: ' + error);
    }
  }
}  
