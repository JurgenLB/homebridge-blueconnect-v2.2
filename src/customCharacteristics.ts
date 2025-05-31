import { Characteristic } from 'homebridge';

export function registerCustomCharacteristics(api: any) {
  // Conductivity
  const CONDUCTIVITY_UUID = '00000001-0000-1000-8000-135D67EC4377';
  class ConductivityCharacteristic extends api.hap.Characteristic {
    static readonly UUID: string = CONDUCTIVITY_UUID;
    constructor() {
      super('Conductivity', ConductivityCharacteristic.UUID, {
        format: api.hap.Formats.FLOAT,
        unit: 'µS/cm',
        minValue: 0,
        maxValue: 100_000,
        minStep: 1,
        perms: [api.hap.Perms.READ, api.hap.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }
  api.hap.Characteristic.Conductivity = ConductivityCharacteristic;

  // pH
  const PH_UUID = '00000002-0000-1000-8000-135D67EC4377';
  class PhCharacteristic extends api.hap.Characteristic {
    static readonly UUID: string = PH_UUID;
    constructor() {
      super('pH', PhCharacteristic.UUID, {
        format: api.hap.Formats.FLOAT,
        unit: '',
        minValue: 0,
        maxValue: 14,
        minStep: 0.01,
        perms: [api.hap.Perms.READ, api.hap.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }
  api.hap.Characteristic.PH = PhCharacteristic;

  // ORP
  const ORP_UUID = '00000003-0000-1000-8000-135D67EC4377';
  class OrpCharacteristic extends api.hap.Characteristic {
    static readonly UUID: string = ORP_UUID;
    constructor() {
      super('ORP', OrpCharacteristic.UUID, {
        format: api.hap.Formats.FLOAT,
        unit: 'mV',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [api.hap.Perms.READ, api.hap.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }
  api.hap.Characteristic.ORP = OrpCharacteristic;

  // --- Custom Services ---

  // Conductivity Sensor Service
  const CONDUCTIVITY_SENSOR_SERVICE_UUID = '00000005-0000-1000-8000-135D67EC4377';
  class ConductivitySensorService extends api.hap.Service {
    static readonly UUID: string = CONDUCTIVITY_SENSOR_SERVICE_UUID;
    constructor(displayName: string, subtype?: string) {
      super(displayName, CONDUCTIVITY_SENSOR_SERVICE_UUID, subtype);
      this.addCharacteristic(api.hap.Characteristic.Conductivity);
    }
  }
  api.hap.Service.ConductivitySensor = ConductivitySensorService;

  // pH Sensor Service
  const PH_SENSOR_SERVICE_UUID = '00000004-0000-1000-8000-135D67EC4377';
  class PhSensorService extends api.hap.Service {
    static readonly UUID: string = PH_SENSOR_SERVICE_UUID;
    constructor(displayName: string, subtype?: string) {
      super(displayName, PH_SENSOR_SERVICE_UUID, subtype);
      this.addCharacteristic(api.hap.Characteristic.PH);
    }
  }
  api.hap.Service.PhSensor = PhSensorService;

  // ORP Sensor Service
  const ORP_SENSOR_SERVICE_UUID = '00000006-0000-1000-8000-135D67EC4377';
  class OrpSensorService extends api.hap.Service {
    static readonly UUID: string = ORP_SENSOR_SERVICE_UUID;
    constructor(displayName: string, subtype?: string) {
      super(displayName, ORP_SENSOR_SERVICE_UUID, subtype);
      this.addCharacteristic(api.hap.Characteristic.ORP);
    }
  }
  api.hap.Service.OrpSensor = OrpSensorService;

  return { ConductivityCharacteristic, PhCharacteristic, OrpCharacteristic };
}
