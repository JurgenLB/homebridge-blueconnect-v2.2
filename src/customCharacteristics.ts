import { API, WithUUID } from 'homebridge';
import { Formats, Perms } from 'hap-nodejs';
import {
  ConductivityCharacteristic,
  PhCharacteristic,
  OrpCharacteristic,
} from './customCharacteristics';

interface BlueDevice {
  blue_device_serial: string;
  swimming_pool_id: string;
  city: string;
  contract_servicePlan: string;
  // Add other properties as needed
  // "contract_servicePlan": "plus",
  // "battery_low": false,
};

//var ConductivityCharacteristic;
//var PhCharacteristic;
//var OrpCharacteristic;


export function createCustomCharacteristicsAndServices(api: API, blueDevice: BlueDevice) {
  // Conductivity
  const conductivityCharacteristicUUID = api.hap.uuid.generate('conductivity-' + blueDevice.blue_device_serial);
  const conductivityServiceUUID = api.hap.uuid.generate('conductivity-service-' + blueDevice.blue_device_serial);

  class ConductivityCharacteristic extends api.hap.Characteristic {
    public static readonly UUID = conductivityCharacteristicUUID;

    constructor() {
      super('Conductivity', conductivityCharacteristicUUID, {
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
      //this.value = this.getDefaultValue();
    }
  }

  class ConductivitySensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, conductivityServiceUUID, subtype);
      this.addCharacteristic(ConductivityCharacteristic);
    }
  }

  // pH
  const phCharacteristicUUID = api.hap.uuid.generate('ph-' + blueDevice.blue_device_serial);
  const phServiceUUID = api.hap.uuid.generate('ph-service-' + blueDevice.blue_device_serial);

  class PhCharacteristic extends api.hap.Characteristic {
    public static readonly UUID = phCharacteristicUUID;

    constructor() {
      super('pH', phCharacteristicUUID, {
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
      //this.value = this.getDefaultValue();
    }
  }

  class PhSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, phServiceUUID, subtype);
      this.addCharacteristic(PhCharacteristic);
    }
  }

  // ORP
  const orpCharacteristicUUID = api.hap.uuid.generate('orp-' + blueDevice.blue_device_serial);
  const orpServiceUUID = api.hap.uuid.generate('orp-service-' + blueDevice.blue_device_serial);

  class OrpCharacteristic extends api.hap.Characteristic {
    public static readonly UUID = orpCharacteristicUUID;

    constructor() {
      super('ORP', orpCharacteristicUUID, {
        format: Formats.FLOAT,
        unit: 'mV',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [
          Perms.Formats.PAIRED_READ,
          Perms.Formats.NOTIFY,
        ],
      });
      //this.value = this.getDefaultValue();
    }
  }

  class OrpSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, orpServiceUUID, subtype);
      this.addCharacteristic(OrpCharacteristic);
    }
  }

  return {
    ConductivityCharacteristic: ConductivityCharacteristic as WithUUID<new () => ConductivityCharacteristic>,
    PhCharacteristic: PhCharacteristic as WithUUID<new () => PhCharacteristic>,
    OrpCharacteristic: OrpCharacteristic as WithUUID<new () => OrpCharacteristic>,
    ConductivitySensorService,
    OrpSensorService,
    PhSensorService,
  };
}

// Export classes individually for direct imports
export { ConductivityCharacteristic, PhCharacteristic, OrpCharacteristic };
