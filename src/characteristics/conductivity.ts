import { API, Characteristic, Formats, Perms, Service } from 'homebridge';

const DISPLAY_NAME = 'Conductivity';
const UUID = '358B77A4-1D2F-4126-910D-C2AFC4DB18C6';

/**
 * Attaches the custom conductivity characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomConductivityCharacteristic(target: Service, api: API): Characteristic {
  let result: Characteristic;

  if (target.testCharacteristic(DISPLAY_NAME)) {
    result = target.getCharacteristic(DISPLAY_NAME)!;
  } else {
    result = target.addCharacteristic(new api.hap.Characteristic(DISPLAY_NAME, UUID, {
      format: Formats.FLOAT,
      unit: 'µS/cm',
      maxValue: 100000,
      minValue: 0,
      minStep: 0.1,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
