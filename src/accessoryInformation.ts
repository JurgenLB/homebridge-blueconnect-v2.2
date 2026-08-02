import type { PlatformAccessory } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { PLUGIN_VERSION } from './settings.js';
type AccessoryInformationOptions = {
  model: string;
  serialNumber: string;
};
export function setAccessoryInformation(
  platform: BlueConnectPlatform,
  accessory: PlatformAccessory,
  options: AccessoryInformationOptions,
) {
  accessory.getService(platform.Service.AccessoryInformation)!
    .setCharacteristic(platform.Characteristic.Manufacturer, 'BlueRiiot')
    .setCharacteristic(platform.Characteristic.Model, options.model)
    .setCharacteristic(platform.Characteristic.SerialNumber, options.serialNumber)
    .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);
}
