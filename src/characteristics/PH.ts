import { API, Characteristic, Formats, Perms, Service } from 'homebridge';

const DISPLAY_NAME = 'pH';

/**
 * Attaches the 'Custom pH' characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @param deviceSerial The serial number of the device, used to generate a stable unique UUID.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomPHCharacteristic(target: Service, api: API, deviceSerial: string): Characteristic {
  let result: Characteristic;

  if (target.testCharacteristic(DISPLAY_NAME)) {
    result = target.getCharacteristic(DISPLAY_NAME)!;
  } else {
    result = target.addCharacteristic(new api.hap.Characteristic(DISPLAY_NAME, api.hap.uuid.generate('PH' + deviceSerial), {
      format: Formats.FLOAT,
      maxValue: 14,
      minValue: 0,
      minStep: 0.01,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    }));
  }

  return result;
}
