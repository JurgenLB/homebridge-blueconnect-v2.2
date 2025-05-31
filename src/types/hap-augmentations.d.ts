import 'homebridge';

declare module 'homebridge' {
  namespace hap {
    interface CharacteristicConstructor {
      Conductivity: typeof Characteristic;
      PH: typeof Characteristic;
      ORP: typeof Characteristic;
    }
    interface ServiceConstructor {
      ConductivitySensor: typeof Service;
      PhSensor: typeof Service;
      OrpSensor: typeof Service;
    }
    // If you use Perms.READ (which is not in standard HAP):
    // interface Perms {
    //   READ: string;
    // }
  }
}
