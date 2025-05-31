import type { API } from 'homebridge';

import { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLATFORM_NAME } from './settings.js';
import { CustomCharacteristics } from './customCharacteristics';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  new CustomCharacteristics(api);
  api.registerPlatform(PLATFORM_NAME, BlueConnectPlatform);
};

