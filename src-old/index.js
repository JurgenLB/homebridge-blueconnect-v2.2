'use strict';

let Service, Characteristic;
const { BlueriiotAPI } = require('./api/blueriiot-api.js');
const {PLUGIN_NAME, PLATFORM_NAME} = require('./settings');
const api = new BlueriiotAPI();

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    //Register Homebridge Accessory
    homebridge.registerAccessory(PLUGIN_NAME, PLATFORM_NAME, BlueConnect);
};

function BlueConnect(log, config, api) {
    this.log = log;
    this.config = config;
    this.homebridge = api;
    this.model = config.model || 'Model not available';
    this.serial = '0000000';
    this.manufacturer = config['manufacturer'] || 'BlueRiiot';

    if (this.config['debug'] === 'true') {
        this.log('CONFIG: Swimming Pool ID '+ this.config.swimmingpoolid)
    }

    if (this.config['debug'] === 'true') {
        this.log('CONFIG: Blue Device Serial '+ this.config.bluedeviceserial)
    }

    this.service = new Service.TemperatureSensor(this.name);
    this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -55, maxValue: 125 })
        .on('get', this.getState.bind(this));

    if (this.config['debug'] === 'true') {
        this.log('BlueRiiot accessory is Created!')
    }
}

// Provide the available services this accessory implements
BlueConnect.prototype = {
    getState : function(callback) {
        if (this.config['debug'] === 'true') {
            this.log('Get State has been called for : '+ this.model)
        }
        //Init the BlueConnect api
        api.init(this.config.email, this.config.password).then(() =>{
            //this.log(api.isAuthenticated());
        }).catch( (error) =>{
            this.log('We have issues signing in: ' + error);
        });
        if (!api.isAuthenticated()) {
            //wait for init before quering Temp, waiting send back 0 degree.
            callback(null, 0);
        } else {
            if (!this.config.swimmingpoolid ) {     // Then get the Swimming Pool ID
                this.log('No swimmingpool ID provided in the CONFIG, trying to get this value : ');
                api.getSwimmingPools().then((data) =>{
                    var jsonParsed = JSON.parse(data);
                    this.log('Add in Config : "swimmingpoolid": "' +jsonParsed.data[0].swimming_pool_id+'"');
                });
                callback(null, 0);
            } else if (!this.config.bluedeviceserial ) {     // Then get the Blue Device Serial
                this.log('No Blue Device Serial provided in the CONFIG, trying to get this value : ');
                api.getSwimmingPoolBlueDevices(this.config.swimmingpoolid).then((data) =>{
                    var jsonParsed = JSON.parse(data);
                    this.log('Add in Config : "bluedeviceserial" : "' +jsonParsed.data[0].blue_device_serial+'"');
                });
                callback(null, 0);
            } else {
                this.temperature = 0;
                api.getLastMeasurements(this.config.swimmingpoolid, this.config.bluedeviceserial)
                    .then((data) =>{
                        var jsonParsed = JSON.parse(data);
                        //console.log(jsonParsed.data[0].name +' : '+jsonParsed.data[0].value);
                        callback(null, jsonParsed.data[0].value);
                        //console.log(jsonParsed.data[1].name +' : '+jsonParsed.data[1].value);
                    }) ;
            }
        }
        //callback(null, this.temperature);
    },

    getServices : function() {
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial);

        this.temperatureService = new Service.TemperatureSensor(this.name);
        this.temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', this.getState.bind(this))
            .setProps({
                minValue: this.minTemperature,
                maxValue: this.maxTemperature,
            });


        return [this.informationService, this.temperatureService];
    },
};
