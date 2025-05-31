import type { API } from 'homebridge';
import { registerCustomCharacteristicsAndServices } from './customCharacteristics';
import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  registerCustomCharacteristicsAndServices(api);
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
};

