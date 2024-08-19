import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { PoolAccessory } from './poolAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

import { BlueConnectApi } from './api/blueriiot-api';

export class BlueConnectPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service;
    public readonly Characteristic: typeof Characteristic;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logging,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;

        this.log.debug('Finished initializing platform:', this.config.name);

        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');

            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
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

        //Init the BlueConnect api
        api.init(this.config.email, this.config.password).then(() =>{
            //this.log(api.isAuthenticated());
        }).catch( (error) =>{
            this.log('We have issues signing in: ' + error);
        });
    }
}
