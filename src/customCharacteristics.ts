import { Formats, Perms, API } from 'homebridge';

export declare interface BlueDevice {
  blue_device_serial: string;
  swimming_pool_id: string;
  city: string;
  contract_servicePlan: string;
  // Add other properties as needed
  // "contract_servicePlan": "plus",
  // "battery_low": false,
};

export declare interface BlueDeviceFormat {
    b: number; // battery level: 0.1-10
    c: number; // conductivity: 0-2000 μS
    o: number; // ORP active chloor: 0-2000 mV
    p: number; // PH: 0-20
    s: number; // Total Dissolved Solids:  g/L
    t: number; // temperature: -273-100 °C actief chloor in mV
}

export declare interface BlueDeviceFormat {
    Battery: number;
    Conductivity: number;
    Orp: number;
    Ph: number;
    TDS: number;
    Temperature: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createCustomCharacteristicsAndServices(api: API, blueDevice: BlueDevice): any {
  const Charact = api.hap.Characteristic;

  // Conductivity
  class ConductivityCharacteristic extends Charact {
    static readonly UUID: string = api.hap.uuid.generate('conductivity-' + blueDevice.blue_device_serial);

    constructor() {
      super('Conductivity', ConductivityCharacteristic.UUID, {
        format: Formats.FLOAT,
        unit: 'µS/cm',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [
          Perms.PAIRED_READ,
          Perms.NOTIFY,
        ],
      });
      this.value = this.getDefaultValue();
    }
  }

  // PH
  class PhCharacteristic extends Charact {
    static readonly UUID: string = api.hap.uuid.generate('ph-' + blueDevice.blue_device_serial);

    constructor() {
      super('pH', PhCharacteristic.UUID, {
        format: Formats.FLOAT,
        unit: '',
        minValue: 0,
        maxValue: 20,
        minStep: 0.01,
        perms: [
          Perms.PAIRED_READ,
          Perms.NOTIFY,
        ],
      });
      this.value = this.getDefaultValue();
    }
  }

  // ORP
  class OrpCharacteristic extends Charact {
    static readonly UUID: string = api.hap.uuid.generate('orp-' + blueDevice.blue_device_serial);

    constructor() {
      super('ORP', OrpCharacteristic.UUID, {
        format: Formats.FLOAT,
        unit: 'mV',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [
          Perms.PAIRED_READ,
          Perms.NOTIFY,
        ],
      });
      this.value = this.getDefaultValue();
    }
  }
  // Conductivity
  class ConductivitySensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('conductivity-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new ConductivityCharacteristic());
    }
  }

  // PH
  class PhSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('ph-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new PhCharacteristic());
    }
  }

  // ORP
  class OrpSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('orp-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new OrpCharacteristic());
    }
  }

  return {
    ConductivityCharacteristic: ConductivityCharacteristic,
    PhCharacteristic: PhCharacteristic,
    OrpCharacteristic: OrpCharacteristic,
    ConductivitySensorService,
    OrpSensorService,
    PhSensorService,
  };
}
