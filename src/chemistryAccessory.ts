import { Service, PlatformAccessory, CharacteristicValue, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP';
import { attachCustomPHCharacteristic } from './characteristics/PH';
import { attachCustomConductivityCharacteristic } from './characteristics/conductivity';
import { getMeasurementValue } from './measurements';

export const CHEMISTRY_METRICS = ['ph', 'orp', 'conductivity'] as const;
export type ChemistryMetric = typeof CHEMISTRY_METRICS[number];

const CHEMISTRY_SERVICE_DEFINITIONS: Record<ChemistryMetric, { name: string; uuid: string }> = {
  ph: {
    name: 'Pool pH',
    uuid: '1D7BEBC7-BF34-4212-8462-0AAB920AB181',
  },
  orp: {
    name: 'Pool ORP',
    uuid: '0BE8BDB1-7A80-45B0-93B8-B2B70949DBD0',
  },
  conductivity: {
    name: 'Pool Conductivity',
    uuid: 'B65A5E83-99B8-44AB-9A4D-4FF2C2E8EAF1',
  },
};

const CHEMISTRY_MEASUREMENT_DEFINITIONS: Record<ChemistryMetric, { name: string; logLabel: string }> = {
  ph: { name: 'ph', logLabel: 'pH' },
  orp: { name: 'orp', logLabel: 'ORP' },
  conductivity: { name: 'conductivity', logLabel: 'conductivity' },
};

const MIN_AMBIENT_LIGHT_LEVEL = 0.0001;

export class ChemistryAccessory {
  private service: Service | null = null;

  private currentORP = 750;
  private currentPH = 7;
  private currentConductivity = 0;

  constructor(
    private readonly platform: BlueConnectPlatform,
    private readonly accessory: PlatformAccessory & { log?: Logging },
    private readonly metric: ChemistryMetric,
  ) {
    this.accessory.log = this.platform.log;

    this.getPoolData().then(() => {
      const deviceModel = this.accessory.context.device.blue_device.hw_type;
      const firmwareRevision = this.accessory.context.device.blue_device.fw_version_psoc;
      const deviceSerial = this.accessory.context.device.blue_device_serial;
      const serviceDefinition = CHEMISTRY_SERVICE_DEFINITIONS[this.metric];
      const serviceName = `${serviceDefinition.name} ${deviceSerial}`;

      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, deviceModel)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, `${deviceSerial}-chemistry-${this.metric}`)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, firmwareRevision);

      const legacyCustomService = this.accessory.services.find(service => service.UUID === serviceDefinition.uuid);
      if (legacyCustomService) {
        this.accessory.removeService(legacyCustomService);
      }

      const setupByMetric: Record<ChemistryMetric, () => Service> = {
        ph: () => {
          const service = this.accessory.getService(this.platform.Service.HumiditySensor) ||
            this.accessory.addService(this.platform.Service.HumiditySensor, serviceDefinition.name);

          service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.handleCurrentPHDisplayGet.bind(this));
          attachCustomPHCharacteristic(service, this.platform.api).onGet(this.handleCurrentPHGet.bind(this));

          return service;
        },
        orp: () => {
          const service = this.accessory.getService(this.platform.Service.LightSensor) ||
            this.accessory.addService(this.platform.Service.LightSensor, serviceDefinition.name);

          service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
            .onGet(this.handleCurrentORPDisplayGet.bind(this));
          attachCustomORPCharacteristic(service, this.platform.api).onGet(this.handleCurrentORPGet.bind(this));

          return service;
        },
        conductivity: () => {
          const service = this.accessory.getService(this.platform.Service.LightSensor) ||
            this.accessory.addService(this.platform.Service.LightSensor, serviceDefinition.name);

          service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
            .onGet(this.handleCurrentConductivityDisplayGet.bind(this));
          attachCustomConductivityCharacteristic(service, this.platform.api).onGet(this.handleCurrentConductivityGet.bind(this));

          return service;
        },
      };
      this.service = setupByMetric[this.metric]();
      this.service.setCharacteristic(this.platform.Characteristic.Name, serviceName);

      setInterval(() => {
        this.getPoolData().catch((error) => {
          this.platform.log.error('Error getting current chemistry data: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    }).catch((error) => {
      this.platform.log.error(`Error initializing chemistry accessory ${this.accessory.context.device.blue_device_serial}-${this.metric}: ${error}`);
    });
  }

  async handleCurrentPHGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentPH;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async handleCurrentPHDisplayGet(): Promise<CharacteristicValue> {
    const phAsHumidity = this.currentPH * 10;

    return Math.max(0, Math.min(100, phAsHumidity));
  }

  async handleCurrentORPGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentORP;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async handleCurrentORPDisplayGet(): Promise<CharacteristicValue> {
    return Math.max(MIN_AMBIENT_LIGHT_LEVEL, this.currentORP);
  }

  async handleCurrentConductivityGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentConductivity;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async handleCurrentConductivityDisplayGet(): Promise<CharacteristicValue> {
    return Math.max(MIN_AMBIENT_LIGHT_LEVEL, this.currentConductivity);
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

      const measurements: Array<{ name: string; value: string | number }> = lastMeasurement.data;
      const measurementDefinition = CHEMISTRY_MEASUREMENT_DEFINITIONS[this.metric];
      const fallbackByMetric: Record<ChemistryMetric, number> = {
        ph: this.currentPH,
        orp: this.currentORP,
        conductivity: this.currentConductivity,
      };
      const value = getMeasurementValue(
        this.platform.log,
        measurements,
        measurementDefinition.name,
        fallbackByMetric[this.metric],
      );

      if (this.metric === 'ph') {
        this.currentPH = value;
      } else if (this.metric === 'orp') {
        this.currentORP = value;
      } else {
        this.currentConductivity = value;
      }

      this.platform.log.debug(`Chemistry ${measurementDefinition.logLabel}: ${value}`);
    } catch (error) {
      this.platform.log.error('Error getting chemistry measurement: ' + error);
    }
  }
}
