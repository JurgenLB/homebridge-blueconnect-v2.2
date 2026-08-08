 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { BlueToken, BlueCredentials } from './BlueToken';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiClientFactory = require('aws-api-gateway-client').default;
const AWS_REGION = 'eu-west-1';

const BASE_HEADERS = {
  'User-Agent': 'BlueConnect/3.2.1',
  'Accept-Language': 'en-DK;q=1.0, da-DK;q=0.9',
  'Accept': '**',
};

const BASE_URL = 'https://api.riiotlabs.com/prod/';

const ERROR_MESSAGES = {
  'NOT_INITIALIZED': 'You have not authenticated yet, please authenticate first.',
};

export class BlueriiotAPI {
  
  __init() {this.email  = ''}
  __init2() {this.password  = ''}

  constructor() {;BlueriiotAPI.prototype.__init.call(this);BlueriiotAPI.prototype.__init2.call(this);BlueriiotAPI.prototype.__init3.call(this);BlueriiotAPI.prototype.__init4.call(this);BlueriiotAPI.prototype.__init5.call(this);BlueriiotAPI.prototype.__init6.call(this);BlueriiotAPI.prototype.__init7.call(this);BlueriiotAPI.prototype.__init8.call(this);BlueriiotAPI.prototype.__init9.call(this);BlueriiotAPI.prototype.__init10.call(this);BlueriiotAPI.prototype.__init11.call(this);BlueriiotAPI.prototype.__init12.call(this);BlueriiotAPI.prototype.__init13.call(this);BlueriiotAPI.prototype.__init14.call(this);BlueriiotAPI.prototype.__init15.call(this);BlueriiotAPI.prototype.__init16.call(this);BlueriiotAPI.prototype.__init17.call(this);BlueriiotAPI.prototype.__init18.call(this);
    this.token = null;
  }

  async init(email , password ) {
    this.email = email;
    this.password = password;

    await this.getToken();
  }

  __init3() {this.getToken = async () => {
    const config = { invokeUrl: BASE_URL };
    const apiClient = apiClientFactory.newClient(config);
    const pathParams = {};
    const pathTemplate = 'user/login';
    const method = 'POST';
    const additionalParams = {
      headers: BASE_HEADERS,
    };
    const body = {
      email: this.email,
      password: this.password,
    };

    try {
      const resultLogin = await apiClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);
      const data = resultLogin.data;
      const cred = data.credentials;

      const blueCred = new BlueCredentials(cred.access_key, cred.secret_key, cred.session_token, cred.expiration);
      this.token = new BlueToken(data.identity_id, data.token, blueCred);
    } catch (resultLogin) {
      // Do nothing
    }
  }}

  __init4() {this.getData = async(
    pathParams ,
    pathTemplate ,
    queryParams ,
    retry = false,
  ) => {
    if(this.token === null) {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }

    let cred = _optionalChain([this, 'access', _5 => _5.token, 'optionalAccess', _6 => _6.credentials]);

    const now = new Date().getTime() + (5 * 60 * 1000); // 5 minutes in the future
    const expire = Date.parse(this.token.credentials.expiration);

    if (now >= expire) {
      await this.getToken();

      cred = _optionalChain([this, 'access', _7 => _7.token, 'optionalAccess', _8 => _8.credentials]);
    }

    try {
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
      const body = {};

      const response = await apiClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);
      const data = response.data;

      return JSON.stringify(data);
    } catch (error) {
      if (retry) {
        throw new Error('Failed to get data from API: ' + error);
      } else {
        await this.getToken();
        return await this.getData(pathParams, pathTemplate, queryParams, true);
      }
    }
  }}

  __init5() {this.isAuthenticated = () => {
    return this.token !== null;
  }}

  __init6() {this.getUser = async () => {
    if (this.isAuthenticated()) {
      const pathParams = {};
      const pathTemplate = 'user/';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init7() {this.getBlueDevice = async (blue_device_serial ) => {
    if (this.isAuthenticated()) {

      const pathParams = {
        blue_device_serial: blue_device_serial,
      };

      const pathTemplate = 'blue/{blue_device_serial}/';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init8() {this.getSwimmingPools = async () => {
    if (this.isAuthenticated()) {
      const pathParams = {};
      const pathTemplate = 'swimming_pool/';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init9() {this.getSwimmingPool = async (swimming_pool_id ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init10() {this.getSwimmingPoolStatus = async (swimming_pool_id ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/status/';


      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init11() {this.getSwimmingPoolBlueDevices = async (swimming_pool_id ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/blue/';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init12() {this.getSwimmingPoolFeed = async (swimming_pool_id , language ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const queryParams = {
        language: language,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/feed';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init13() {this.getLastMeasurements = async (swimming_pool_id , blue_device_serial ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
        blue_device_serial: blue_device_serial,
      };
      const queryParams = {
        mode: 'blue_and_strip',
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/blue/{blue_device_serial}/lastMeasurements';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init14() {this.getGuidance = async (swimming_pool_id , language ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const queryParams = {
        language: language,
        mode: 'interactive_v03',
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/guidance';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init15() {this.getGuidanceHistory = async (swimming_pool_id , language ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const queryParams = {
        language: language,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/guidance/history';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init16() {this.getChemistry = async (swimming_pool_id ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const queryParams = {};
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/chemistry';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init17() {this.getWeather = async (swimming_pool_id , language ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        swimming_pool_id: swimming_pool_id,
      };
      const queryParams = {
        language: language,
      };
      const pathTemplate = 'swimming_pool/{swimming_pool_id}/weather';

      return await this.getData(pathParams, pathTemplate, queryParams);
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}

  __init18() {this.getBlueDeviceCompatibility = async (blue_device_serial ) => {
    if (this.isAuthenticated()) {
      const pathParams = {
        blue_device_serial: blue_device_serial,
      };
      const pathTemplate = 'blue/{blue_device_serial}/compatibility';

      return await this.getData(pathParams, pathTemplate, '');
    } else {
      throw new Error(ERROR_MESSAGES.NOT_INITIALIZED);
    }
  }}
}
