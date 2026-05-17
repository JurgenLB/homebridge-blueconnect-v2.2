import type { API, Characteristic, Service } from 'homebridge';

const DISPLAY_NAME = 'Conductivity';

/**
 * Attaches the 'Custom Conductivity' characteristic to the service.
 * @param target The service to which the characteristic should be attached.
 * @param api The Homebridge {@link API} instance in use for the plug-in.
 * @param deviceSerial The serial number of the device, used to generate a stable unique UUID.
 * @returns The {@link Characteristic} instance.
 */
export function attachCustomConductivityCharacteristic(target: Service, api: API, deviceSerial: string): Characteristic {
  let result: Characteristic;

  if (target.testCharacteristic(DISPLAY_NAME)) {
    result = target.getCharacteristic(DISPLAY_NAME)!;
  } else {
    result = target.addCharacteristic(new api.hap.Characteristic(DISPLAY_NAME, api.hap.uuid.generate('Conductivity' + deviceSerial), {
      format: api.hap.Formats.UINT16,
      unit: 'µS/cm',
      maxValue: 10000,
      minValue: 0,
      minStep: 1,
      perms: [api.hap.Perms.PAIRED_READ, api.hap.Perms.NOTIFY],
    }));
  }

  return result;
}
