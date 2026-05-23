import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP';
import { attachCustomPHCharacteristic } from './characteristics/PH';
import { attachCustomConductivityCharacteristic } from './characteristics/conductivity';
import { getMeasurementValue } from './measurements';

export class ChemistryAccessory {
  private service: Service | null = null;

  private currentORP = 750;
  private currentPH = 0;
  private currentConductivity = 0;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;

    this.getPoolData().then(() => {
      const deviceModel = this.accessory.context.device.blue_device.hw_type;
      const firmwareRevision = this.accessory.context.device.blue_device.fw_version_psoc;
      const deviceSerial = this.accessory.context.device.blue_device_serial;

      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, deviceModel)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, `${deviceSerial}-chemistry`)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, firmwareRevision);

      this.service = this.accessory.getService(
        this.platform.Service.LightSensor) || this.accessory.addService(this.platform.Service.LightSensor, 'Pool Chemistry',
      );

      // LightSensor is used as the visible HomeKit-compatible service to expose chemistry values.
      this.service.setCharacteristic(this.platform.Characteristic.Name, `${deviceSerial} Chemistry`);
      this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .onGet(this.handleCurrentORPGet.bind(this));
      attachCustomPHCharacteristic(this.service, this.platform.api)
        .onGet(this.handleCurrentPHGet.bind(this));
      attachCustomORPCharacteristic(this.service, this.platform.api)
        .onGet(this.handleCurrentORPGet.bind(this));
      attachCustomConductivityCharacteristic(this.service, this.platform.api)
        .onGet(this.handleCurrentConductivityGet.bind(this));

      setInterval(() => {
        this.getPoolData().catch((error) => {
          this.platform.log.error('Error getting current chemistry data: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30) );
    }).catch((error) => {
      this.platform.log.error('Error initializing chemistry accessory: ' + error);
    });
  }

  async handleCurrentPHGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentPH;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async handleCurrentORPGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentORP;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async handleCurrentConductivityGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentConductivity;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getPoolData() {
    this.platform.log.debug(
      'Getting current chemistry data for ' +
      this.accessory.context.device.blue_device_serial +
      ' and pool ' +
      this.accessory.context.device.swimming_pool_id,
    );

    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );

      const lastMeasurement = JSON.parse(lastMeasurementString);

      if (!Array.isArray(lastMeasurement.data)) {
        this.platform.log.warn('Last chemistry measurement payload is missing data array, keeping previous values');

        return;
      }

      const measurements: Array<{ name: string; value: number }> = lastMeasurement.data;

      this.currentORP = getMeasurementValue(this.platform.log, measurements, 'orp', this.currentORP);
      this.currentPH = getMeasurementValue(this.platform.log, measurements, 'ph', this.currentPH);
      this.currentConductivity = getMeasurementValue(this.platform.log, measurements, 'conductivity', this.currentConductivity);

      this.platform.log.debug('Chemistry ORP: ' + this.currentORP);
      this.platform.log.debug('Chemistry pH: ' + this.currentPH);
      this.platform.log.debug('Chemistry conductivity: ' + this.currentConductivity);
    } catch (error) {
      this.platform.log.error('Error getting chemistry measurement: ' + error);
    }
  }
}
