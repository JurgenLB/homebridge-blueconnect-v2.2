import { PlatformAccessory, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { getCustomCharacteristics, getCustomServices } from './characteristics/customHomeKitTypes.js';
import { CharacteristicDelegate } from './characteristics/CharacteristicDelegate.js';

export class PoolAccessory {
  private loggingService: { addEntry: (entry: { temp: number; humidity: number; time: number; pressure: number }) => void };

  // CharacteristicDelegates – set once services are wired up.
  private phDelegate!: CharacteristicDelegate<number>;
  private orpDelegate!: CharacteristicDelegate<number>;
  private conductivityDelegate!: CharacteristicDelegate<number>;

  constructor(
        private readonly platform: BlueConnectPlatform,
        private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;
    this.loggingService = new this.platform.fakeGatoHistoryService('weather', this.accessory, { storage: 'fs' });

    this.getPoolData().then(() => {
      // Accessory information
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
        .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
        .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
        .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

      // ── Temperature (standard TemperatureSensor service) ──────────────────
      const tempService =
        this.accessory.getService(this.platform.Service.TemperatureSensor) ||
        this.accessory.addService(this.platform.Service.TemperatureSensor);

      tempService.setCharacteristic(
        this.platform.Characteristic.Name,
        this.accessory.context.device.blue_device_serial,
      );
      tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
        .onGet(this.handleCurrentTemperatureGet.bind(this));

      // ── Custom services (MyHomeKitTypes pattern) ───────────────────────────
      const { PHSensor, ORPSensor, ConductivitySensor } = getCustomServices(this.platform.api);
      const { PH, ORP, Conductivity } = getCustomCharacteristics(this.platform.api);

      const phService =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.getServiceById(PHSensor as any, 'ph-sensor') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.addService(PHSensor as any, 'pH Sensor', 'ph-sensor');

      const orpService =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.getServiceById(ORPSensor as any, 'orp-sensor') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.addService(ORPSensor as any, 'ORP Sensor', 'orp-sensor');

      const conductivityService =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.getServiceById(ConductivitySensor as any, 'conductivity-sensor') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.accessory.addService(ConductivitySensor as any, 'Conductivity Sensor', 'conductivity-sensor');

      // ── CharacteristicDelegates ────────────────────────────────────────────
      const { hap } = this.platform.api;
      const commFailure = hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE;
      const isAuthenticated = () => this.platform.blueRiotAPI.isAuthenticated();

      this.phDelegate = new CharacteristicDelegate<number>(
        this.platform.log, this.accessory, phService, PH, 'ph', 7, ' pH',
      ).onGet(isAuthenticated, hap.HapStatusError, commFailure);

      this.orpDelegate = new CharacteristicDelegate<number>(
        this.platform.log, this.accessory, orpService, ORP, 'orp', 750, ' mV',
      ).onGet(isAuthenticated, hap.HapStatusError, commFailure);

      this.conductivityDelegate = new CharacteristicDelegate<number>(
        this.platform.log, this.accessory, conductivityService, Conductivity, 'conductivity', 0, ' µS/cm',
      ).onGet(isAuthenticated, hap.HapStatusError, commFailure);

      setInterval(() => {
        this.getPoolData().catch((error) => {
          this.platform.log.error('Error getting current pool data: ' + error);
        });
      }, 60000 * (this.platform.config.refreshInterval || 30));
    });
  }

  /** Handle requests to get the current value of the CurrentTemperature characteristic. */
  async handleCurrentTemperatureGet(): Promise<number> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.accessory.context.temperature ?? 25;
    }
    throw new this.platform.api.hap.HapStatusError(
      this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
    );
  }

  async getPoolData() {
    this.platform.log.debug(
      'Getting current pool data for ' +
        this.accessory.context.device.blue_device_serial +
        ' and pool ' +
        this.accessory.context.device.swimming_pool_id,
    );

    try {
      const lastMeasurementString = await this.platform.blueRiotAPI.getLastMeasurements(
        this.accessory.context.device.swimming_pool_id,
        this.accessory.context.device.blue_device_serial,
      );

      this.platform.log.debug('Last measurement: ' + lastMeasurementString);

      const lastMeasurement = JSON.parse(lastMeasurementString);
      const find = (name: string) =>
        lastMeasurement.data.find((e: { name: string }) => e.name === name)?.value ?? 0;

      const temperature: number = find('temperature');
      const orp: number = find('orp');
      const ph: number = find('ph');
      const conductivity: number = find('conductivity');

      // Persist temperature for onGet handler
      this.accessory.context.temperature = temperature;

      // Delegates update HomeKit and persist values
      if (this.phDelegate) {
        this.phDelegate.value = ph;
      }
      if (this.orpDelegate) {
        this.orpDelegate.value = orp;
      }
      if (this.conductivityDelegate) {
        this.conductivityDelegate.value = conductivity;
      }

      this.loggingService.addEntry({
        time: Math.round(new Date().valueOf() / 1000),
        temp: temperature,
        pressure: orp,
        humidity: ph,
      });

      this.platform.log.debug('Temperature: ' + temperature);
      this.platform.log.debug('ORP: ' + orp + ' mV');
      this.platform.log.debug('pH: ' + ph);
      this.platform.log.debug('Conductivity: ' + conductivity + ' µS/cm');
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + error);
    }
  }
}
