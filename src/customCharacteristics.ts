import { API } from 'homebridge';
import { Formats, Perms } from 'hap-nodejs';
import { StaticEventEmitterOptions } from "events";
export type { StaticEventEmitterOptions };

interface BlueDevice {
  blue_device_serial: string;
  swimming_pool_id: string;
  city: string;
  contract_servicePlan: string;
  // Add other properties as needed
  // "contract_servicePlan": "plus",
  // "battery_low": false,
};

// Conductivity
class ConductivityCharacteristic extends Characteristic {
  constructor(api: API, blueDevice: BlueDevice) {
    super('Conductivity', api.hap.uuid.generate('conductivity-' + blueDevice.blue_device_serial), {
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
  }
};

export const ConductivityCharacteristicWrapper: WithUUID<typeof Characteristic> = {
  UUID: api.hap.uuid.generate('unique-id'),
  new: () => new ConductivityCharacteristic(apiInstance, blueDeviceInstance),
};

// PH
class PhCharacteristic extends Characteristic {
  constructor(api: API, blueDevice: BlueDevice) {
    super('pH', api.hap.uuid.generate('ph-' + blueDevice.blue_device_serial), {
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
  }
};

export const PhCharacteristicWrapper: WithUUID<typeof Characteristic> = {
  UUID: api.hap.uuid.generate('unique-id'),
  new: () => new PhCharacteristic(apiInstance, blueDeviceInstance),
};

// ORP
class OrpCharacteristic extends Characteristic {
  constructor(api: API, blueDevice: BlueDevice) {
    super('ORP', api.hap.uuid.generate('orp-' + blueDevice.blue_device_serial), {
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
  }
};

export const OrpCharacteristicWrapper: WithUUID<typeof Characteristic> = {
  UUID: api.hap.uuid.generate('unique-id'),
  new: () => new OrpCharacteristic(apiInstance, blueDeviceInstance),
};


export function createCustomCharacteristicsAndServices(api: API, blueDevice: BlueDevice) {
  //public _sideloadCharacteristics;
  //public emitCharacteristicWarningEvent;
  //public setupCharacteristicEventHandlers;

  // Conductivity
  class ConductivitySensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('conductivity-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new ConductivityCharacteristic(api, blueDevice));
    }
  }

  // PH
  class PhSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('ph-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new PhCharacteristic(api, blueDevice));
    }
  }

  // ORP
  class OrpSensorService extends api.hap.Service {
    constructor(displayName: string, subtype?: string) {
      super(displayName, api.hap.uuid.generate('orp-service-' + blueDevice.blue_device_serial), subtype);
      this.addCharacteristic(new OrpCharacteristic(api, blueDevice));
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

export { ConductivityCharacteristic, PhCharacteristic, OrpCharacteristic };
