import type { API } from 'homebridge';
import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the platform with Homebridge
 */
module.exports = (api: API) => {
  //createCustomCharacteristicsAndServices(api);
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
};

