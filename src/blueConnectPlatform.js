

import { PoolAccessory } from './poolAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import { BlueriiotAPI } from './api/blueriiot-api.js';
import { CHEMISTRY_METRICS, ChemistryAccessory, } from './chemistryAccessory';
import { WeatherAccessory } from './weatherAccessory';










export class BlueConnectPlatform  {
  
  
  
  



  // this is used to track restored cached accessories
    __init() {this.accessories = []}

  constructor(
          log,
          config,
          api,
  ) {;this.log = log;this.config = config;this.api = api;BlueConnectPlatform.prototype.__init.call(this);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.fakeGatoHistoryService = require('fakegato-history')(this.api);

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      this.discoverDevices();
    });

    this.blueRiotAPI = new BlueriiotAPI();
  }

  configureAccessory(accessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  /**
     * Register discovered devices as accessories.
     */
  discoverDevices() {
    if (this.config.email === undefined || this.config.password === undefined) {
      this.log.warn('No email or password provided. Exiting setup');

      return;
    }

    this.blueRiotAPI.init(this.config.email, this.config.password).then(() =>{
      if(!this.blueRiotAPI.isAuthenticated()) {
        this.log.warn('BlueConnect: Unable to authenticate. Did you provide the correct email and password?');

        return;
      }

      this.log.info('BlueConnect: Logged in successfully');

      this.blueRiotAPI.getSwimmingPools().then((poolData) =>{
        const pools = JSON.parse(poolData).data;

        this.log.debug('BlueConnect: Pools: ' + JSON.stringify(pools, null, 2));
        this.log.info('BlueConnect: Found ' + pools.length + ' pools');

        const poolIds = pools.map((pool ) => pool.swimming_pool_id);

        poolIds.forEach((poolId ) => {
          this.blueRiotAPI.getSwimmingPoolBlueDevices(poolId).then((blueDevicesData) =>{
            const blueDevices = JSON.parse(blueDevicesData).data;
            this.log.debug('BlueConnect: BlueDevices: ' + JSON.stringify(blueDevices, null, 2));
            this.log.info('BlueConnect: Found ' + blueDevices.length + ' devices');

            blueDevices.forEach((blueDevice ) => {
              this.processBlueDevice(blueDevice);
              this.processChemistryAccessories(blueDevice);
            });

            this.processWeatherAccessory(poolId);
          });
        });
      }).catch((error ) =>{
        this.log.warn('We have issues getting the pools: ' + error);
      });
    }).catch( (error) =>{
      this.log.warn('We have issues signing in: ' + error);
    });
  }

   processWeatherAccessory(poolId) {
    if (this.config.weather) {
      const uuid = this.api.hap.uuid.generate('weather-' + poolId.substring(0, 10));
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        new WeatherAccessory(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', 'weather-' + poolId.substring(0, 10));

        const accessory = new this.api.platformAccessory('weather-' + poolId, uuid);

        accessory.context.device = { swimming_pool_id: poolId };

        new WeatherAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    } else {
      // Clean up the weather accessory if it exists
      const uuid = this.api.hap.uuid.generate('weather-' + poolId.substring(0, 10));
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
      }
    }
  }

   processBlueDevice(blueDevice) {
    const uuid = this.api.hap.uuid.generate(blueDevice.blue_device_serial);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

      new PoolAccessory(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory:', blueDevice.blue_device_serial);

      const accessory = new this.api.platformAccessory(blueDevice.blue_device_serial, uuid);

      accessory.context.device = blueDevice;

      new PoolAccessory(this, accessory);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

   processChemistryAccessories(blueDevice) {
    CHEMISTRY_METRICS.forEach((metric) => {
      this.processChemistryAccessory(blueDevice, metric);
    });
  }

   processChemistryAccessory(blueDevice, metric) {
    const uuid = this.api.hap.uuid.generate(`${blueDevice.blue_device_serial}-chemistry-${metric}`);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
    const accessoryName = `${blueDevice.blue_device_serial}-chemistry-${metric}`;

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

      new ChemistryAccessory(this, existingAccessory, metric);
    } else {
      this.log.info('Adding new accessory:', accessoryName);

      const accessory = new this.api.platformAccessory(accessoryName, uuid);

      accessory.context.device = blueDevice;

      new ChemistryAccessory(this, accessory, metric);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
