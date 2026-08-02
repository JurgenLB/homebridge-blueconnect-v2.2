import type { PlatformAccessory } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLUGIN_VERSION } from './settings.js';

/**
 * Sets the AccessoryInformation characteristics for an accessory using plugin metadata
 * from package.json. The model is always set to the plugin's displayName ('BlueConnect').
 *
 * @param accessory    The platform accessory to configure.
 * @param platform     The BlueConnect platform instance.
 * @param serialNumber Optional serial number to set on the accessory.
 */

type AccessoryInformationOptions = {
  model: string;
  serialNumber: string;
};

export function setAccessoryInfo(
  accessory: PlatformAccessory,
  platform: BlueConnectPlatform,
  options: AccessoryInformationOptions,
) {
  accessory.getService(platform.Service.AccessoryInformation)!
    .setCharacteristic(platform.Characteristic.Manufacturer, 'BlueRiiot')
    .setCharacteristic(platform.Characteristic.Model, options.model)
    .setCharacteristic(platform.Characteristic.SerialNumber, options.serialNumber)
    .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);
  }
