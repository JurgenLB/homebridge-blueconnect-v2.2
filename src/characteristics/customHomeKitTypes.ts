import type { API, Characteristic, WithUUID } from 'homebridge';

// Custom UUIDs for all pool measurement characteristics.
// Using a dedicated BlueConnect namespace to avoid collisions with Eve or other plugins.
const PH_UUID = 'AB810001-0000-1000-8000-135D90492D38';
const ORP_UUID = 'AB810003-0000-1000-8000-135D90492D38';
const CONDUCTIVITY_UUID = 'AB810002-0000-1000-8000-135D90492D38';

export type PoolCustomCharacteristic = WithUUID<new () => Characteristic>;

export type PoolCustomCharacteristics = {
  PH: PoolCustomCharacteristic;
  ORP: PoolCustomCharacteristic;
  Conductivity: PoolCustomCharacteristic;
};

let _characteristics: PoolCustomCharacteristics | null = null;

/**
 * Returns (and lazily initialises) the custom pool HomeKit characteristics.
 *
 * The design mirrors the `CustomHomeKitTypes` pattern from homebridge-lib:
 * each characteristic is a subclass of `hap.Characteristic` with a no-arg
 * constructor and a static `UUID` property, so it can be used directly with
 * `service.addCharacteristic()` and `service.testCharacteristic()`.
 *
 * @param api - The Homebridge API instance.
 */
export function getCustomCharacteristics(api: API): PoolCustomCharacteristics {
  if (_characteristics !== null) {
    return _characteristics;
  }

  const { Characteristic, Formats, Perms } = api.hap;

  /** pH – dimensionless, range 0–14, resolution 0.01 */
  class PH extends Characteristic {
    static readonly UUID = PH_UUID;
    constructor() {
      super('PH', PH_UUID, {
        format: Formats.FLOAT,
        unit: 'pH',
        minValue: 0,
        maxValue: 14,
        minStep: 0.01,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }

  /** ORP (Oxidation Reduction Potential) – millivolts, range 0–1100 mV */
  class ORP extends Characteristic {
    static readonly UUID = ORP_UUID;
    constructor() {
      super('ORP', ORP_UUID, {
        format: Formats.UINT16,
        unit: 'mV',
        minValue: 0,
        maxValue: 1100,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }

  /** Conductivity – µS/cm, range 0–10 000 µS/cm */
  class Conductivity extends Characteristic {
    static readonly UUID = CONDUCTIVITY_UUID;
    constructor() {
      super('Conductivity', CONDUCTIVITY_UUID, {
        format: Formats.UINT16,
        unit: 'µS/cm',
        minValue: 0,
        maxValue: 10000,
        minStep: 1,
        perms: [Perms.PAIRED_READ, Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  }

  _characteristics = { PH, ORP, Conductivity };

  return _characteristics;
}
