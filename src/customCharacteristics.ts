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

  return { ConductivityCharacteristic, PhCharacteristic, OrpCharacteristic };
}