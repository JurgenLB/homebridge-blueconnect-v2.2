
import { API, Characteristic, Formats, Perms, Service } from 'homebridge';


const DISPLAY_NAME = 'Conductivity';
const UUID = 'C7B54322-1234-5678-ABCD-EF0123456789';

/**
 * Attaches the 'Custom Conductivity' characteristic to the service.
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
      format: Formats.UINT16,
      unit: 'µS/cm',
      maxValue: 5000,
      minValue: 0,
      minStep: 1,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
