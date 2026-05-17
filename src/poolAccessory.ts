import { Service, PlatformAccessory, CharacteristicValue, Characteristic, Logging } from 'homebridge';
import type { BlueConnectPlatform } from './blueConnectPlatform.js';
import { attachCustomORPCharacteristic } from './characteristics/ORP.js';
import { attachCustomPHCharacteristic } from './characteristics/PH.js';
import { attachCustomConductivityCharacteristic } from './characteristics/Conductivity.js';

const GUIDANCE_LANGUAGE = 'en';
type MetricEntry = { name?: string; value?: number | string | null };

export class PoolAccessory {
  private temperatureService: Service;
  private phCharacteristic: Characteristic;
  private orpCharacteristic: Characteristic;
  private conductivityCharacteristic: Characteristic;
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

    this.temperatureService = this.accessory.getService(
      this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor,
    );
    this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.blue_device_serial);
    this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));

    this.removeLegacyMetricServices('ph', 'service-ph-');
    this.phCharacteristic = attachCustomPHCharacteristic(
      this.temperatureService,
      this.platform.api,
      accessory.context.device.blue_device_serial,
    )
      .onGet(this.handleCurrentPHGet.bind(this));

    this.removeLegacyMetricServices('orp', 'service-orp-');
    this.orpCharacteristic = attachCustomORPCharacteristic(
      this.temperatureService,
      this.platform.api,
      accessory.context.device.blue_device_serial,
    )
      .onGet(this.handleCurrentORPGet.bind(this));

    this.removeLegacyMetricServices('conductivity', 'service-conductivity-');
    this.conductivityCharacteristic = attachCustomConductivityCharacteristic(
      this.temperatureService,
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

  private removeLegacyMetricServices(subtype: string, legacyServiceUuidSeed: string) {
    const legacyServiceUuid = this.platform.api.hap.uuid.generate(legacyServiceUuidSeed + this.accessory.context.device.blue_device_serial);
    const servicesToRemove = this.accessory.services.filter((service) =>
      (service.UUID === this.platform.Service.AirQualitySensor.UUID && service.subtype === subtype)
      || (service.UUID === legacyServiceUuid && service.subtype === subtype),
    );
    servicesToRemove.forEach((service) => this.accessory.removeService(service));
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private getMetricValue(data: MetricEntry[], name: string, fallback: number): number {
    const rawValue = data.find((element) => element.name === name)?.value;

    if (rawValue === null || rawValue === undefined) {
      this.platform.log.warn(`Missing or invalid '${name}' value, keeping previous value for ${this.accessory.context.device.blue_device_serial}`);
      return fallback;
    }

    const parsedValue = Number(rawValue);

    if (!Number.isFinite(parsedValue)) {
      this.platform.log.warn(`Missing or invalid '${name}' value, keeping previous value for ${this.accessory.context.device.blue_device_serial}`);
      return fallback;
    }

    return parsedValue;
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

      const hasMeasurementData = Array.isArray(lastMeasurement?.data);
      if (!hasMeasurementData) {
        this.platform.log.warn(`Missing measurement data array for ${this.accessory.context.device.blue_device_serial}`);
      }
      const measurementData: MetricEntry[] = hasMeasurementData ? lastMeasurement.data : [];
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

      this.temperatureService.getCharacteristic(this.platform.Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
      this.phCharacteristic.updateValue(this.currentPH);
      this.orpCharacteristic.updateValue(this.currentORP);

      const guidanceString = await this.platform.blueRiotAPI.getGuidance(
        this.accessory.context.device.swimming_pool_id,
        GUIDANCE_LANGUAGE,
      );

      this.platform.log.debug('Guidance: ' + guidanceString);

      const guidance = JSON.parse(guidanceString);
      const hasGuidanceData = Array.isArray(guidance?.data);
      if (!hasGuidanceData) {
        this.platform.log.warn(`Missing guidance data array for ${this.accessory.context.device.blue_device_serial}`);
      }
      const guidanceData: MetricEntry[] = hasGuidanceData ? guidance.data : [];
      this.currentConductivity = this.getMetricValue(guidanceData, 'conductivity', this.currentConductivity);
      this.platform.log.debug('Current conductivity: ' + this.currentConductivity);
      this.conductivityCharacteristic.updateValue(this.currentConductivity);
    } catch (error) {
      this.platform.log.error('Error getting last measurement: ' + this.formatError(error));
    }
  }
}
