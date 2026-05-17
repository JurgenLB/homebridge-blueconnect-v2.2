import type { Service, PlatformAccessory, CharacteristicValue, Characteristic, Logging } from 'homebridge' with { 'resolution-mode': 'import' };
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP.js';
import { attachCustomPHCharacteristic } from './characteristics/PH.js';
import { attachCustomConductivityCharacteristic } from './characteristics/Conductivity.js';
import { LEGACY_METRIC_UUID_SEEDS } from './settings.js';

const GUIDANCE_LANGUAGE = 'en';
type MetricEntry = { name?: string; value?: number | string | null };
type MetricBindings = {
  temperatureService: Service;
  phCharacteristic: Characteristic;
  orpCharacteristic: Characteristic;
  conductivityCharacteristic: Characteristic;
};

export class PoolAccessory {
  private temperatureService: Service | null = null;
  private phCharacteristic: Characteristic | null = null;
  private orpCharacteristic: Characteristic | null = null;
  private conductivityCharacteristic: Characteristic | null = null;
  private loggingService: { addEntry: (entry: { temp: number; humidity: number; time: number; pressure: number }) => void };

  private currentTemperature = 25;
  private currentORP = 750;
  private currentPH = 0;
  private currentConductivity = 0;

  constructor(
        private readonly platform: BlueConnectPlatform,
        private readonly accessory: PlatformAccessory & { log?: Logging },
  ) {
    this.accessory.log = this.platform.log;
    this.loggingService = new this.platform.fakeGatoHistoryService('weather', this.accessory, { storage: 'fs' });

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'BlueRiiot')
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device.blue_device.hw_type)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.context.device.blue_device_serial)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.accessory.context.device.blue_device.fw_version_psoc);

    const temperatureService = this.accessory.getService(
      this.platform.Service.TemperatureSensor) || this.accessory.addService(
      this.platform.Service.TemperatureSensor,
      accessory.context.device.blue_device_serial,
    );
    this.temperatureService = temperatureService;
    temperatureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.blue_device_serial);
    temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    this.removeLegacyMetricServices();
    this.removeLegacyAirQualityCharacteristics(temperatureService);
    this.phCharacteristic = attachCustomPHCharacteristic(
      temperatureService,
      this.platform.api,
      accessory.context.device.blue_device_serial,
    )
      .onGet(this.handleCurrentPHGet.bind(this));

    this.orpCharacteristic = attachCustomORPCharacteristic(
      temperatureService,
      this.platform.api,
      accessory.context.device.blue_device_serial,
    )
      .onGet(this.handleCurrentORPGet.bind(this));

    this.conductivityCharacteristic = attachCustomConductivityCharacteristic(
      temperatureService,
      this.platform.api,
      accessory.context.device.blue_device_serial,
    )
      .onGet(this.handleCurrentConductivityGet.bind(this));

    this.getPoolData().catch((error) => {
      this.platform.log.error('Error getting current pool data: ' + this.formatError(error));
    });

    setInterval(() => {
      this.getPoolData().catch((error) => {
        this.platform.log.error('Error getting current pool data: ' + this.formatError(error));
      });
    }, 60000 * (this.platform.config.refreshInterval || 30));
  }

  private removeLegacyMetricServices() {
    const legacyServiceUuids = LEGACY_METRIC_UUID_SEEDS.map((seed) =>
      this.platform.api.hap.uuid.generate(seed + this.accessory.context.device.blue_device_serial),
    );
    const servicesToRemove = this.accessory.services.filter((service) =>
      service.UUID === this.platform.Service.AirQualitySensor.UUID
      || legacyServiceUuids.includes(service.UUID),
    );

    if (servicesToRemove.length > 0) {
      this.platform.log.info(`Removing ${servicesToRemove.length} legacy metric services for: ${this.accessory.context.device.blue_device_serial}`);
    }

    servicesToRemove.forEach((service) => this.accessory.removeService(service));
  }

  private removeLegacyAirQualityCharacteristics(temperatureService: Service) {
    const airQualityCharacteristics = temperatureService.characteristics.filter((characteristic) =>
      characteristic.displayName === 'Air Quality'
      || characteristic.UUID === this.platform.Characteristic.AirQuality.UUID,
    );

    if (airQualityCharacteristics.length > 0) {
      this.platform.log.info(
        `Removing ${airQualityCharacteristics.length} legacy Air Quality characteristics for: ${this.accessory.context.device.blue_device_serial}`,
      );
    }

    airQualityCharacteristics.forEach((characteristic) => {
      temperatureService.removeCharacteristic(characteristic);
    });
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.stack || error.message : String(error);
  }

  /**
   * Returns the parsed numeric metric value from the API payload.
   * Falls back to the previous value when the metric is missing or invalid.
   * @param data Metric entries from the API payload.
   * @param name The metric name to extract.
   * @param fallback The previous metric value to keep when parsing fails.
   * @returns The parsed metric value or the provided fallback.
   */
  private getMetricValue(data: MetricEntry[], name: string, fallback: number): number {
    const rawValue = data.find((element) => element.name === name)?.value;

    if (rawValue === undefined) {
      this.platform.log.warn(`Missing '${name}' value, keeping previous value for ${this.accessory.context.device.blue_device_serial}`);
      return fallback;
    }

    if (rawValue === null) {
      this.platform.log.warn(`Null '${name}' value received, keeping previous value for ${this.accessory.context.device.blue_device_serial}`);
      return fallback;
    }

    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue)) {
      this.platform.log.warn(`Invalid '${name}' value '${rawValue}', keeping previous value for ${this.accessory.context.device.blue_device_serial}`);
      return fallback;
    }

    return parsedValue;
  }

  private getMetricBindings(): MetricBindings | null {
    if (!this.temperatureService || !this.phCharacteristic || !this.orpCharacteristic || !this.conductivityCharacteristic) {
      this.platform.log.warn(`Metric characteristics are not initialized for ${this.accessory.context.device.blue_device_serial}`);
      return null;
    }

    return {
      temperatureService: this.temperatureService,
      phCharacteristic: this.phCharacteristic,
      orpCharacteristic: this.orpCharacteristic,
      conductivityCharacteristic: this.conductivityCharacteristic,
    };
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    if(this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentTemperature;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Handle requests to get the current value of the "Current PH" characteristic
   */
  async handleCurrentPHGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentPH;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
     * Handle requests to get the current value of the "Current ORP" characteristic
     */
  async handleCurrentORPGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentORP;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
     * Handle requests to get the current value of the "Current Conductivity" characteristic
     */
  async handleCurrentConductivityGet(): Promise<CharacteristicValue> {
    if (this.platform.blueRiotAPI.isAuthenticated()) {
      return this.currentConductivity;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getPoolData() {
    const metricBindings = this.getMetricBindings();
    if (!metricBindings) {
      return;
    }

    this.platform.log.debug(
      'Getting current temperature for ' +
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

      const isMeasurementDataArray = Array.isArray(lastMeasurement?.data);
      if (!isMeasurementDataArray) {
        this.platform.log.warn(`Missing measurement data array for ${this.accessory.context.device.blue_device_serial}; continuing with previous values`);
      }
      const measurementData: MetricEntry[] = isMeasurementDataArray ? lastMeasurement.data : [];
      this.currentTemperature = this.getMetricValue(measurementData, 'temperature', this.currentTemperature);
      this.currentORP = this.getMetricValue(measurementData, 'orp', this.currentORP);
      this.currentPH = this.getMetricValue(measurementData, 'ph', this.currentPH);

      this.loggingService.addEntry({
        time: Math.round(new Date().valueOf() / 1000),
        temp: this.currentTemperature,
        pressure: this.currentORP,
        humidity: this.currentPH * 10,
      });

      this.platform.log.debug('Current temperature: ' + this.currentTemperature);
      this.platform.log.debug('Current ORP: ' + this.currentORP);
      this.platform.log.debug('Current pH: ' + this.currentPH);

      metricBindings.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
      metricBindings.phCharacteristic.updateValue(this.currentPH);
      metricBindings.orpCharacteristic.updateValue(this.currentORP);

      const guidanceString = await this.platform.blueRiotAPI.getGuidance(
        this.accessory.context.device.swimming_pool_id,
        GUIDANCE_LANGUAGE,
      );

      this.platform.log.debug('Guidance: ' + guidanceString);

      const guidance = JSON.parse(guidanceString);
      const isGuidanceDataArray = Array.isArray(guidance?.data);
      if (!isGuidanceDataArray) {
        this.platform.log.warn(`Missing guidance data array for ${this.accessory.context.device.blue_device_serial}; continuing with previous values`);
      }
      const guidanceData: MetricEntry[] = isGuidanceDataArray ? guidance.data : [];
      this.currentConductivity = this.getMetricValue(guidanceData, 'conductivity', this.currentConductivity);
      this.platform.log.debug('Current conductivity: ' + this.currentConductivity);
      metricBindings.conductivityCharacteristic.updateValue(this.currentConductivity);
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + this.formatError(error));
    }
  }
}
