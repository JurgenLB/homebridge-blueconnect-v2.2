import { Service, Characteristic, API } from 'homebridge';

// --- Custom Characteristics ---
// Conductivity
export const ConductivityCharacteristic = function () {
  Characteristic.call(this, 'Conductivity', uuid.generate('ConductivityCharacteristic'));
  this.setProps({
    format: Characteristic.Formats.FLOAT,
    unit: 'µS/cm',
    minValue: 0,
    maxValue: 2000,
    minStep: 1,
    perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY]
  });
  this.value = this.getDefaultValue();
};

// Define a custom Conductivity Sensor Service
export const ConductivitySensorService = function (displayName: string, subtype?: string) {
  Service.call(this, displayName, uuid.generate('ConductivitySensorService'), subtype);
  this.addCharacteristic(ConductivityCharacteristic);
};


// pH
export const PhCharacteristic = function () {
  Characteristic.call(this, 'Ph', uuid.generate('PhCharacteristic'));
  this.setProps({
    format: Characteristic.Formats.FLOAT,
    unit: '',
    minValue: 0,
    maxValue: 20,
    minStep: 1,
    perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY]
  });
  this.value = this.getDefaultValue();
};

// Define a custom PH Sensor Service
export const PhSensorService = function (displayName: string, subtype?: string) {
  Service.call(this, displayName, uuid.generate('PhSensorService'), subtype);
  this.addCharacteristic(PhCharacteristic);
};

// ORP
export const PhCharacteristic = function () {
  Characteristic.call(this, 'ORP', uuid.generate('OrpCharacteristic'));
  this.setProps({
    format: Characteristic.Formats.FLOAT,
    unit: 'mV',
    minValue: 0,
    maxValue: 2000,
    minStep: 1,
    perms: [Characteristic.Perms.PAIRED_READ, Characteristic.Perms.NOTIFY],
  });
  this.value = this.getDefaultValue();
};

// Define a custom PH Sensor Service
export const OrpSensorService = function (displayName: string, subtype?: string) {
  Service.call(this, displayName, uuid.generate('OrpSensorService'), subtype);
  this.addCharacteristic(OrpCharacteristic);
};
  
// --- Custom Services ---
ConductivitySensorService.prototype = Object.create(Service.prototype);
ConductivitySensorService.prototype.constructor = ConductivitySensorService;

PhSensorService.prototype = Object.create(Service.prototype);
PhSensorService.prototype.constructor = PhSensorService;

OrpSensorService.prototype = Object.create(Service.prototype);
OrpSensorService.prototype.constructor = OrpSensorService;
