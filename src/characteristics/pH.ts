
import { API, Characteristic, Formats, Perms, Service } from 'homebridge';


const DISPLAY_NAME = 'pH';
const UUID = 'C7B54321-1234-5678-ABCD-EF0123456789';

/**
 * Attaches the 'Custom pH' characteristic to the service.
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
      minStep: 0.01,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
