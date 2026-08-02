import type { PlatformAccessory } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { displayName: string; version: string };

/**
 * Sets the AccessoryInformation characteristics for an accessory using plugin metadata
 * from package.json. The model is always set to the plugin's displayName ('BlueConnect').
 *
 * @param accessory    The platform accessory to configure.
 * @param platform     The BlueConnect platform instance.
 * @param serialNumber Optional serial number to set on the accessory.
 */
export function setAccessoryInfo(
  accessory: PlatformAccessory,
  platform: BlueConnectPlatform,
  serialNumber?: string,
): void {
  const info = accessory.getService(platform.Service.AccessoryInformation)!;

  info.setCharacteristic(platform.Characteristic.Manufacturer, 'BlueRiiot');
  info.setCharacteristic(platform.Characteristic.Model, pkg.displayName);
  info.setCharacteristic(platform.Characteristic.FirmwareRevision, pkg.version);

  if (serialNumber !== undefined) {
    info.setCharacteristic(platform.Characteristic.SerialNumber, serialNumber);
  }
}
