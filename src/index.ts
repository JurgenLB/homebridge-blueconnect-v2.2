import type { API } from 'homebridge';

import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';
import { registerCustomCharacteristics } from './customCharacteristics';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  registerCustomCharacteristics(api);
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
};

