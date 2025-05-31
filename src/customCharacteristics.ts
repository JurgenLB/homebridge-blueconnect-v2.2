import { Service, Characteristic, API } from 'homebridge';

// --- Custom Characteristics ---
// Conductivity
export class ConductivityCharacteristic extends Characteristic {
  static readonly UUID: string = '00000001-0000-1000-8000-135D67EC4377';
  constructor() {
    super('Conductivity', ConductivityCharacteristic.UUID, {
      format: Characteristic.Formats.FLOAT,
      unit: 'µS/cm',
      minValue: 0,
      maxValue: 100_000,
      minStep: 1,
      perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
    });
  }
}

// pH
export class PhCharacteristic extends Characteristic {
  static readonly UUID: string = '00000002-0000-1000-8000-135D67EC4377';
  constructor() {
    super('pH', PhCharacteristic.UUID, {
      format: api.hap.Formats.FLOAT,
      unit: '',
      minValue: 0,
      maxValue: 14,
      minStep: 0.01,
      perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
    });
  }
}

// ORP
export class OrpCharacteristic extends Characteristic {
  static readonly UUID: string = '00000003-0000-1000-8000-135D67EC4377';
  constructor() {
    super('ORP', OrpCharacteristic.UUID, {
      format: api.hap.Formats.FLOAT,
      unit: 'mV',
      minValue: 0,
      maxValue: 2000,
      minStep: 1,
      perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
    });
  }
}
  
// --- Custom Services ---
// Conductivity Sensor Service
export class ConductivitySensorService extends Service {
  static readonly UUID: string = '00000005-0000-1000-8000-135D67EC4377';
  constructor(displayName: string, subtype?: string) {
    super(displayName, ConductivitySensorService.UUID, subtype);
    this.addCharacteristic(ConductivityCharacteristic);
  }
}

// pH Sensor Service
export class PhSensorService extends Service {
  static readonly UUID: string = '00000004-0000-1000-8000-135D67EC4377';
  constructor(displayName: string, subtype?: string) {
    super(displayName, PhSensorService.UUID, subtype);
    this.addCharacteristic(PhCharacteristic);
  }
}

// ORP Sensor Service
export class OrpSensorService extends api.hap.Service {
  static readonly UUID: string = '00000006-0000-1000-8000-135D67EC4377';
  constructor(displayName: string, subtype?: string) {
    super(displayName, OrpSensorService.UUID, subtype);
    this.addCharacteristic(OrpCharacteristic);
  }
}

// --- Registration Function ---
export function registerCustomCharacteristicsAndServices(api: API) {
  api.hap.Service.ConductivitySensor = ConductivitySensorService;
  api.hap.Characteristic.Conductivity = ConductivityCharacteristic;
  api.hap.Service.PhSensor = PhSensorService;
  api.hap.Characteristic.Ph = PhCharacteristic;
  api.hap.Service.OrpSensor = OrpSensorService;
  api.hap.Characteristic.Orp = OrpCharacteristic;

}
