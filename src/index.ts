import type { API } from 'homebridge';

import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';
import { registerCustomCharacteristicsAndServices } from './customCharacteristics';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  registerCustomCharacteristicsAndServices(api);
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
};

