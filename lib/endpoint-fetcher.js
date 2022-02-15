'use strict';

const axios = require('axios').default;

const Settings = require('@janiscommerce/settings');

const MsCallError = require('./ms-call-error');

module.exports = class EndpointFetcher {

	static get endpointSettingName() {
		return 'discoveryHost';
	}

	static get endpoint() {

		if(!this._endpoint) {

			const discoveryHost = Settings.get(this.endpointSettingName);

			if(!discoveryHost)
				throw new MsCallError(`Missing endpoint setting '${this.endpointSettingName}'`, MsCallError.codes.INVALID_DISCOVERY_HOST_SETTING);

			this._endpoint = `${discoveryHost}api/endpoint`;
		}

		return this._endpoint;
	}

	static async get(service, namespace, method) {

		if(!this.cache)
			this.cache = {};

		const key = `${service}-${namespace}-${method}`;

		if(!this.cache[key])
			this.cache[key] = await this.fetch(service, namespace, method);

		return this.cache[key];
	}

	static async fetch(service, namespace, method) {

		try {

			const { data, status } = await axios.request({
				url: this.endpoint,
				params: { service, namespace, method },
				headers: { 'content-type': 'application/json' },
				validateStatus: () => true
			});

			if(status >= 400)
				throw new MsCallError(`Endpoint not found: ${service} - ${namespace} - ${method}`, MsCallError.codes.ENDPOINT_NOT_FOUND);

			return data;

		} catch(error) {

			if(error.name === 'MsCallError')
				throw error;

			throw new MsCallError(error, MsCallError.codes.ENDPOINT_REQUEST_FAILED);

		}
	}
};
