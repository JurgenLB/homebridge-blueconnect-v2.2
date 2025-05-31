import type { API } from 'homebridge';
import { registerCustomCharacteristicsAndServices } from './customCharacteristics';

import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the platform with Homebridge
 */
export function registerCustomCharacteristicsAndServices (api: API) => {
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
  api.hap.Service.ConductivitySensor = ConductivitySensorService;
  api.hap.Characteristic.Conductivity = ConductivityCharacteristic;
  api.hap.Service.PhSensor = PhSensorService;
  api.hap.Characteristic.Ph = PhCharacteristic;
  api.hap.Service.OrpSensor = OrpSensorService;
  api.hap.Characteristic.Orp = OrpCharacteristic;
};

