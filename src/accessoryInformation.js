

import { PLUGIN_VERSION } from './settings.js';




export function setAccessoryInformation(
  platform,
  accessory,
  options,
) {
  accessory.getService(platform.Service.AccessoryInformation)
    .setCharacteristic(platform.Characteristic.Manufacturer, 'BlueRiiot')
    .setCharacteristic(platform.Characteristic.Model, options.model)
    .setCharacteristic(platform.Characteristic.SerialNumber, options.serialNumber)
    .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);
}
