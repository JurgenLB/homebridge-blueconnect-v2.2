import { API, Characteristic, Formats, Perms, Service } from 'homebridge';

const DISPLAY_NAME = 'pH';
const UUID = 'AD304B47-2C03-4CA6-9D93-376A714DF85A';

/**
 * Attaches the custom pH characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomPHCharacteristic(target: Service, api: API): Characteristic {
  let result: Characteristic;

  if (target.testCharacteristic(DISPLAY_NAME)) {
    result = target.getCharacteristic(DISPLAY_NAME)!;
  } else {
    result = target.addCharacteristic(new api.hap.Characteristic(DISPLAY_NAME, UUID, {
      format: Formats.FLOAT,
      unit: 'pH',
      maxValue: 14,
      minValue: 0,
      minStep: 0.1,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
