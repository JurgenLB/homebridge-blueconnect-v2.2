 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

import { getMeasurementValue } from './measurements';

export const CHEMISTRY_METRICS = ['ph', 'orp', 'conductivity'] ;
 


















const CHEMISTRY_SERVICE_DEFINITIONS






 = {
  ph: {
    characteristicKey: 'VOCDensity',
    defaultThresholds: {
      okMax: 7.6,
      warningHigh: 8.4,
      warningLow: 6.6,
    },
    legacyCustomServiceUuid: '1D7BEBC7-BF34-4212-8462-0AAB920AB181',
    maxValue: 14,
    minStep: 0.1,
    name: 'Pool pH',
  },
  orp: {
    characteristicKey: 'SulphurDioxideDensity',
    defaultThresholds: {
      okMax: 760,
      warningHigh: 900,
      warningLow: 400,
    },
    legacyCustomServiceUuid: '0BE8BDB1-7A80-45B0-93B8-B2B70949DBD0',
    maxValue: 1100,
    minStep: 1,
    name: 'Pool ORP',
  },
  conductivity: {
    characteristicKey: 'PM10Density',
    defaultThresholds: {
      okMax: 10000,
      okMin: 300,
      warningHigh: 12000,
      warningLow: 200,
    },
    legacyCustomServiceUuid: 'B65A5E83-99B8-44AB-9A4D-4FF2C2E8EAF1',
    maxValue: 100000,
    minStep: 0.1,
    name: 'Pool Conductivity',
  },
};

const CHEMISTRY_MEASUREMENT_DEFINITIONS = {
  ph: { name: 'ph', logLabel: 'pH' },
  orp: { name: 'orp', logLabel: 'ORP' },
  conductivity: { name: 'conductivity', logLabel: 'conductivity' },
};

export class ChemistryAccessory {
   __init() {this.service = null}

   __init2() {this.currentORP = 750}
   __init3() {this.currentPH = 7}
   __init4() {this.currentConductivity = 0}
   __init5() {this.currentStatus = null}

  constructor(
      platform,
      accessory,
      metric,
  ) {;this.platform = platform;this.accessory = accessory;this.metric = metric;ChemistryAccessory.prototype.__init.call(this);ChemistryAccessory.prototype.__init2.call(this);ChemistryAccessory.prototype.__init3.call(this);ChemistryAccessory.prototype.__init4.call(this);ChemistryAccessory.prototype.__init5.call(this);
    this.accessory.log = this.platform.log;

    this.getPoolData().then(() => {
      const deviceModel = this.accessory.context.device.blue_device.hw_type;
      const firmwareRevision = this.accessory.context.device.blue_device.fw_version_psoc;
      const deviceSerial = this.accessory.context.device.blue_device_serial;
      const serviceDefinition = CHEMISTRY_SERVICE_DEFINITIONS[this.metric];

      this.accessory.getService(this.platform.Service.AccessoryInformation)
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, deviceModel)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, `${deviceSerial}-chemistry-${this.metric}`)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, firmwareRevision);

      const legacyLightSensor = this.accessory.getService(this.platform.Service.LightSensor);
      if (legacyLightSensor) {
        this.accessory.removeService(legacyLightSensor);
      }

      const legacyHumiditySensor = this.accessory.getService(this.platform.Service.HumiditySensor);
      if (legacyHumiditySensor) {
        this.accessory.removeService(legacyHumiditySensor);
      }

      const legacyTemperatureSensor = this.accessory.getService(this.platform.Service.TemperatureSensor);
      if (legacyTemperatureSensor) {
        this.accessory.removeService(legacyTemperatureSensor);
      }

      const legacyCustomService = this.accessory.services.find(s => s.UUID === serviceDefinition.legacyCustomServiceUuid);
      if (legacyCustomService) {
        this.accessory.removeService(legacyCustomService);
      }

      this.service = this.accessory.getService(this.platform.Service.AirQualitySensor) ||
        this.accessory.addService(this.platform.Service.AirQualitySensor, serviceDefinition.name);

      this.service.setCharacteristic(this.platform.Characteristic.Name, `${serviceDefinition.name} ${deviceSerial}`);
      this.service.setCharacteristic(this.platform.Characteristic.AirQuality,
        this.getCurrentAirQualityValue());
      this.service.getCharacteristic(this.platform.Characteristic.AirQuality)
        .onGet(this.handleCurrentAirQualityGet.bind(this));

      const ctor = this.platform.Characteristic[serviceDefinition.characteristicKey];
      if (!this.service.testCharacteristic(ctor)) {
        this.service.addOptionalCharacteristic(ctor);
      }
      this.service.getCharacteristic(ctor)
        .setProps({ maxValue: serviceDefinition.maxValue, minStep: serviceDefinition.minStep, minValue: 0 })
        .onGet(this.handleCurrentMetricGet.bind(this));

      setInterval(() => {
        this.getPoolData().catch((error) => {
          this.platform.log.error('Error getting current chemistry data: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    }).catch((error) => {
      this.platform.log.error(`Error initializing chemistry accessory ${this.accessory.context.device.blue_device_serial}-${this.metric}: ${error}`);
    });
  }

  async handleCurrentMetricGet() {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.getCurrentMetricValue();
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
  async handleCurrentAirQualityGet() {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.getCurrentAirQualityValue();
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

      const measurements = lastMeasurement.data;
      const measurementDefinition = CHEMISTRY_MEASUREMENT_DEFINITIONS[this.metric];
      const serviceDefinition = CHEMISTRY_SERVICE_DEFINITIONS[this.metric];
      const measurement = measurements.find((entry) => entry.name === measurementDefinition.name);
      const fallbackByMetric = {
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
      const thresholds = this.resolveThresholds(measurement, serviceDefinition.defaultThresholds);
      this.currentStatus = this.resolveStatus(value, thresholds);
      switch (this.metric) {
      case 'ph':
        this.currentPH = value;
        break;
      case 'orp':
        this.currentORP = value;
        break;
      case 'conductivity':
        this.currentConductivity = value;
        break;
      }

      this.platform.log.debug(`Chemistry ${measurementDefinition.logLabel}: ${value}`);
      this.platform.log.debug(`Chemistry ${measurementDefinition.logLabel} status: ${this.currentStatus}`);
      if (this.service) {
        this.service.updateCharacteristic(this.platform.Characteristic.AirQuality, this.getCurrentAirQualityValue());
      }
    } catch (error) {
      this.platform.log.error('Error getting chemistry measurement: ' + error);
    }
  }

   getCurrentMetricValue() {
    switch (this.metric) {
    case 'ph':
      return this.currentPH;
    case 'orp':
      return this.currentORP;
    case 'conductivity':
      return this.currentConductivity;
    }
  }
   getCurrentAirQualityValue() {
    const airQuality = this.platform.Characteristic.AirQuality;
    switch (this.currentStatus) {
    case 'low':
      return airQuality.FAIR;
    case 'ok':
      return airQuality.GOOD;
    case 'high':
      return airQuality.POOR;
    default:
      return airQuality.UNKNOWN;
    }
  }
   resolveThresholds(measurement, defaultThresholds) {
    return {
      okMax: _nullishCoalesce(this.getNumericMeasurementField(measurement, 'ok_max'), () => ( defaultThresholds.okMax)),
      okMin: _nullishCoalesce(this.getNumericMeasurementField(measurement, 'ok_min'), () => ( defaultThresholds.okMin)),
      warningHigh: _nullishCoalesce(this.getNumericMeasurementField(measurement, 'warning_high'), () => ( defaultThresholds.warningHigh)),
      warningLow: _nullishCoalesce(this.getNumericMeasurementField(measurement, 'warning_low'), () => ( defaultThresholds.warningLow)),
    };
  }
   resolveStatus(value, thresholds) {
    if (value <= thresholds.warningLow) {
      return 'low';
    }
    if (value >= thresholds.warningHigh) {
      return 'high';
    }
    if (thresholds.okMin != null && value < thresholds.okMin) {
      return 'low';
    }
    if (thresholds.okMax != null && value > thresholds.okMax) {
      return 'high';
    }
    return 'ok';
  }
   getNumericMeasurementField(measurement, field) {
    const value = _optionalChain([measurement, 'optionalAccess', _ => _[field]]);
    if (value == null) {
      return undefined;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }
}
