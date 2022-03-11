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
				throw new MicroServiceCallError(`Missing endpoint setting '${this.endpointSettingName}'`, MicroServiceCallError.codes.INVALID_DISCOVERY_HOST_SETTING); // eslint-disable-line max-len

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

		const url = this.endpoint;

		let response;

		try {

			response = await axios.request({
				url,
				params: { service, namespace, method },
				headers: { 'content-type': 'application/json' },
				validateStatus: () => true
			});

		} catch(error) {
			throw new MicroServiceCallError(error, MicroServiceCallError.codes.ENDPOINT_REQUEST_FAILED);
		}

		if(response.status >= 400)
			throw new MicroServiceCallError(`Endpoint not found: ${service} - ${namespace} - ${method}`, MicroServiceCallError.codes.ENDPOINT_NOT_FOUND);

		return response.data;
	}
};
