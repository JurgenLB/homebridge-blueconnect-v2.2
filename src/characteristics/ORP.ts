
import type { API, Characteristic, Service } from 'homebridge';

import { getCustomCharacteristics } from './customHomeKitTypes.js';

/**
 * Attaches the custom ORP characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomORPCharacteristic(target: Service, api: API): Characteristic {
  const { ORP } = getCustomCharacteristics(api);
  return target.testCharacteristic(ORP.UUID)
    ? target.getCharacteristic(ORP.UUID)!
    : target.addCharacteristic(ORP);
}
