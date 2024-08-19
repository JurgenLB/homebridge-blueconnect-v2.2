const { BlueToken, BlueCredentials } = require('../BlueToken.js');

const apiClientFactory = require('aws-api-gateway-client').default;
const AWS_REGION = 'eu-west-1';

const BASE_HEADERS = {
    'User-Agent': 'BlueConnect/3.2.1',
    'Accept-Language': 'en-DK;q=1.0, da-DK;q=0.9',
    'Accept': '**',
};
const BASE_URL = 'https://api.riiotlabs.com/prod/';

class BlueriiotAPI {
    token;
    user;

    constructor() {
        this.token = '';
    }

    async init(email, password) {
        this.email = email;
        this.password = password;
        await this.getToken();
    }

    getToken = async () => {
        const config = { invokeUrl: BASE_URL };
        var apigClient = apiClientFactory.newClient(config);
        var pathParams = {};
        var pathTemplate = 'user/login';
        var method = 'POST';
        var additionalParams = {
            headers: BASE_HEADERS,
        };
        var body = {
            email: this.email,
            password: this.password,
        };

        try {
            var resultLogin = await apigClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);
            var data = resultLogin.data;
            var cred = data.credentials;

            var blueCred = new BlueCredentials(cred.access_key, cred.secret_key, cred.session_token, cred.expiration);
            this.token = new BlueToken(data.identity_id, data.token, blueCred);

        } catch (resultLogin) {
            this.token = '';
            throw new Error(resultLogin.response.data.errorMessage);
        }
    };

    getData = async(pathParams, pathTemplate, queryParams) => {
        const cred = this.token.credentials;
        // Check if expired and refresh if needed
        const now = new Date();
        const expire = Date.parse(this.token.credentials.expiration);

        if (expire > now) {
            await this.getToken();
        }

        const apiClient = apiClientFactory.newClient({
            invokeUrl: BASE_URL,
            region: AWS_REGION,
            accessKey: cred.access_key,
            secretKey: cred.secret_key,
            sessionToken: cred.session_token,
        });

        const method = 'GET';
        const additionalParams = {
            headers: BASE_HEADERS,
            queryParams: queryParams,
        };
        const body = {
        };

        // var result = '';
        try {
            const response = await apiClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);
            const data = response.data;

            return JSON.stringify(data);
        } catch (result) {
            throw new Error(result);
        }
    };

    isAuthenticated = () => {
        return this.token !== '';
    };

    getUser = async () => {
        if (this.isAuthenticated()) {
            const pathParams = {};
            const pathTemplate = 'user/';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getBlueDevice = async (blue_device_serial) => {
        if (this.isAuthenticated()) {

            const pathParams = {
                blue_device_serial: blue_device_serial,
            };

            const pathTemplate = 'blue/{blue_device_serial}/';
            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getSwimmingPools = async () => {
        if (this.isAuthenticated()) {
            var pathParams = {};
            var pathTemplate = 'swimming_pool/';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getSwimmingPool = async (swimming_pool_id) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getSwimmingPoolStatus = async (swimming_pool_id) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/status/';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getSwimmingPoolBlueDevices = async (swimming_pool_id) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/blue/';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
                //console.error("Error, Can't get userdata");
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getSwimmingPoolFeed = async (swimming_pool_id, language) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const queryParams = {
                language: language,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/feed';
            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getLastMeasurements = async (swimming_pool_id, blue_device_serial) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
                blue_device_serial: blue_device_serial,
            };
            const queryParams = {
                mode: 'blue_and_strip',
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/blue/{blue_device_serial}/lastMeasurements';

            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getGuidance = async (swimming_pool_id, language) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const queryParams = {
                language: language,
                mode: 'interactive_v03',
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/guidance';

            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getGuidanceHistory = async (swimming_pool_id, language) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const queryParams = {
                language: language,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/guidance/history';

            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getChemistry = async (swimming_pool_id) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const queryParams = {};
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/chemistry';

            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getWeather = async (swimming_pool_id, language) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                swimming_pool_id: swimming_pool_id,
            };
            const queryParams = {
                language: language,
            };
            const pathTemplate = 'swimming_pool/{swimming_pool_id}/weather';

            try {
                return await this.getData(pathParams, pathTemplate, queryParams);
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

    getBlueDeviceCompatibility = async (blue_device_serial) => {
        if (this.isAuthenticated()) {
            const pathParams = {
                blue_device_serial: blue_device_serial,
            };
            const pathTemplate = 'blue/{blue_device_serial}/compatibility';

            try {
                return await this.getData(pathParams, pathTemplate, '');
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('You need to init api first!');
        }
    };

}

module.exports = { BlueriiotAPI };
