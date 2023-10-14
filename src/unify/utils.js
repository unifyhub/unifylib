// unify.js
let nodeFetch;
try {
	nodeFetch = require('node-fetch');
} catch (e) {
	nodeFetch = null;
}

const ENV_GAS = 'GAS', ENV_NODE = 'NODE', ENV_BROWSER = 'BROWSER';
let UNIFY_ENV;
if (typeof PropertiesService !== "undefined") {
	UNIFY_ENV = ENV_GAS;
} else if (nodeFetch !== null) {
	UNIFY_ENV = ENV_NODE;
} else {
	UNIFY_ENV = ENV_BROWSER;
}

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
				// We need to return a promise here to keep the API consistent
				return await this.response.text();
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

		switch (UNIFY_ENV) {
			case ENV_GAS:
				// Wrap the synchronous call in a Promise
				response = await new Promise((resolve, reject) => {
					try {
						const gasResponse = UrlFetchApp.fetch(url, options);
						resolve(gasResponse);
					} catch (e) {
						reject(e);
					}
				});
				break;
			case ENV_NODE:
				const nodeFetch = require('node-fetch');
				response = await nodeFetch(url, options);
				break;
			case ENV_BROWSER:
				response = await fetch(url, options);
				break;
			default:
				throw new Error('Unknown environment');
		}

		return new UnifyResponse(response, UNIFY_ENV);
	}
};

const UnifyLogger = {
	log: (level, message) => {
		switch (UNIFY_ENV) {
			case ENV_GAS:
			case ENV_NODE:
			case ENV_BROWSER:
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
	}
};

export const Unify = {
	Request: UnifyRequest,
	Log: UnifyLogger
};



