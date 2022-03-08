'use strict';

const axios = require('axios').default;

const Settings = require('@janiscommerce/settings');

const MicroServiceCallError = require('./ms-call-error');

module.exports = class EndpointFetcher {

	static get endpointSettingName() {
		return 'discoveryHost';
	}

	static get endpoint() {

		if(!this._endpoint) {

			const discoveryHost = Settings.get(this.endpointSettingName);

			if(!discoveryHost)
				// eslint-disable-next-line max-len
				throw new MicroServiceCallError(`Missing endpoint setting '${this.endpointSettingName}'`, MicroServiceCallError.codes.INVALID_DISCOVERY_HOST_SETTING);

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
				throw new MicroServiceCallError(`Endpoint not found: ${service} - ${namespace} - ${method}`, MicroServiceCallError.codes.ENDPOINT_NOT_FOUND);

			return data;

		} catch(error) {

			if(error.name === 'MicroServiceCallError')
				throw error;

			throw new MicroServiceCallError(error, MicroServiceCallError.codes.ENDPOINT_REQUEST_FAILED);
		}
	}
};
