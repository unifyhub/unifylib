let nodeFetch;
try {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  nodeFetch = require('node-fetch');
} catch (e) {
  nodeFetch = null;
}

const ENV_GAS = 'GAS'; const ENV_NODE = 'NODE'; const
  ENV_BROWSER = 'BROWSER';
let UNIFY_ENV;
if (typeof PropertiesService !== 'undefined') {
  UNIFY_ENV = ENV_GAS;
} else if (nodeFetch !== null) {
  UNIFY_ENV = ENV_NODE;
} else {
  UNIFY_ENV = ENV_BROWSER;
}

const UnifyLogger = {
  log: (level, message) => {
    switch (UNIFY_ENV) {
      case ENV_GAS:
      case ENV_NODE:
      case ENV_BROWSER:
        // eslint-disable-next-line no-console
        console.log(`[${level.toUpperCase()}]: ${message}`);
        break;
      default:
        throw new Error('Unknown environment');
    }
  },
  info: (message) => {
    UnifyLogger.log('info', message);
  },
  error: (message) => {
    UnifyLogger.log('error', message);
  },
};

class UnifyResponse {
  constructor(response) {
    this.response = response;
  }

  // Note: Making a method asynchronous means it will always return a Promise.
  async text() {
    switch (UNIFY_ENV) {
      case ENV_GAS:
        return this.response.getContentText();
      case ENV_NODE:
      case ENV_BROWSER:
        return this.response.text();
      default:
        throw new Error('Unknown environment');
    }
  }

  get status() {
    switch (UNIFY_ENV) {
      case ENV_GAS:
        return this.response.getResponseCode();
      case ENV_NODE:
      case ENV_BROWSER:
        return this.response.status;
      default:
        throw new Error('Unknown environment');
    }
  }
}

const UnifyRequest = {
  fetch: async (url, options) => {
    let response;

    UnifyLogger.info(`Initiating request to: ${url} with options: ${JSON.stringify(options)}`);

    switch (UNIFY_ENV) {
      case ENV_GAS:
        response = await new Promise((resolve, reject) => {
          try {
            const gasResponse = UrlFetchApp.fetch(url, options);
            resolve(gasResponse);
          } catch (e) {
            UnifyLogger.error(`Request to ${url} failed with error: ${e.message}`);
            reject(e);
          }
        });
        break;
      case ENV_NODE:
        try {
          // eslint-disable-next-line global-require,import/no-extraneous-dependencies,no-shadow
          const fetch = require('node-fetch');
          response = await fetch(url, options);
        } catch (e) {
          UnifyLogger.error(`Request to ${url} failed with error: ${e.message}`);
          throw e;
        }
        break;
      case ENV_BROWSER:
        try {
          response = await fetch(url, options);
        } catch (e) {
          UnifyLogger.error(`Request to ${url} failed with error: ${e.message}`);
          throw e;
        }
        break;
      default:
        throw new Error('Unknown environment');
    }
    UnifyLogger.info(`Received response with status: ${response.status} from: ${url}`);
    return new UnifyResponse(response, UNIFY_ENV);
  },
};

const UnifyUtils = {
  base64Encode: (content) => {
    switch (UNIFY_ENV) {
      case ENV_GAS:
        return Utilities.base64Encode(content);
      case ENV_NODE:
        return Buffer.from(content).toString('base64');
      case ENV_BROWSER:
        return btoa(content);
      default:
        throw new Error('Unknown environment');
    }
  },

  base64DecodeToString: (content) => {
    switch (UNIFY_ENV) {
      case ENV_GAS:
        return Utilities.newBlob(Utilities.base64Decode(content)).getDataAsString();
      case ENV_NODE:
        return Buffer.from(content, 'base64').toString('utf-8');
      case ENV_BROWSER:
        return atob(content);
      default:
        throw new Error('Unknown environment');
    }
  },
};

const Unify = {
  Request: UnifyRequest,
  Log: UnifyLogger,
  Utils: UnifyUtils,
};

export default Unify;
