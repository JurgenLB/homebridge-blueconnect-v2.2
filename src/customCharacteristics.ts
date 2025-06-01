import { Service, Characteristic } from 'homebridge';

const ConductivityServiceUUID = this.api.hap.uuid.generate('conductivity-service-' + blueDevice.blue_device_serial);
const PhServiceUUID = this.api.hap.uuid.generate('ph-service-' + blueDevice.blue_device_serial);
const OrpServiceUUID = this.api.hap.uuid.generate('orp-service-' + blueDevice.blue_device_serial);


// --- Custom Characteristics ---
// Conductivity
export function createConductivityCharacteristic(api, blueDevice) {
  const uuid = api.hap.uuid.generate('conductivity-' + blueDevice.blue_device_serial);
  return class ConductivityCharacteristic extends api.hap.Characteristic {
    constructor() {
      super('Conductivity', uuid);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'µS/cm',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [api.hap.Characteristic.Perms.PAIRED_READ, api.hap.Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  };
};

// Define a custom Conductivity Sensor Service
export class ConductivitySensorService extends this.api.hap.Service {
  constructor(displayName: string, subtype?: string) {
    super(displayName, ConductivityServiceUUID, subtype);
    this.addCharacteristic(ConductivityCharacteristic);
  }
}


// pH
export function createPhCharacteristic(api, blueDevice) {
  const uuid = api.hap.uuid.generate('ph-' + blueDevice.blue_device_serial);
  return class PhCharacteristic extends api.hap.Characteristic {
    constructor() {
      super('pH', uuid);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: '',
        minValue: 0,
        maxValue: 20,
        minStep: 1,
        perms: [api.hap.Characteristic.Perms.PAIRED_READ, api.hap.Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  };
};

// Define a custom PH Sensor Service
export class PhSensorService extends this.api.hap.Service {
  constructor(displayName: string, subtype?: string) {
    super(displayName, PhServiceUUID, subtype);
    this.addCharacteristic(PhCharacteristic);
  }
}

// ORP
export function createOrpCharacteristic(api, blueDevice) {
  const uuid = api.hap.uuid.generate('ORP-' + blueDevice.blue_device_serial);
  return class OrpCharacteristic extends api.hap.Characteristic {
    constructor() {
      super('Orp', uuid);
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: 'mV',
        minValue: 0,
        maxValue: 2000,
        minStep: 1,
        perms: [api.hap.Characteristic.Perms.PAIRED_READ, api.hap.Characteristic.Perms.NOTIFY],
      });
      this.value = this.getDefaultValue();
    }
  };
};

// Define a custom ORP Sensor Service
export class OrpSensorService extends this.api.hap.Service {
  constructor(displayName: string, subtype?: string) {
    super(displayName, OrpServiceUUID, subtype);
    this.addCharacteristic(OrpCharacteristic);
  }
}
  
// --- Custom Services ---
ConductivitySensorService.prototype = Object.create(Service.prototype);
ConductivitySensorService.prototype.constructor = ConductivitySensorService;

PhSensorService.prototype = Object.create(Service.prototype);
PhSensorService.prototype.constructor = PhSensorService;

OrpSensorService.prototype = Object.create(Service.prototype);
OrpSensorService.prototype.constructor = OrpSensorService;
