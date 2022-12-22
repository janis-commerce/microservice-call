'use strict';

const { Invoker } = require('@janiscommerce/lambda');

let cache = {};

module.exports = class Discovery {

	static async getEndpoint(service, namespace, method) {

		const cacheKey = `${service}.${namespace}.${method}`;

		if(!cache[cacheKey]) {

			const { payload: { baseUrl, path, method: httpMethod } } = await Invoker.clientCall('discovery', 'GetEndpoint', { service, namespace, method });

			const endpoint = `${baseUrl}${path}`;

			cache[cacheKey] = { endpoint, httpMethod };
		}

		return cache[cacheKey];
	}

	static cleanCache() {
		cache = {};
	}
};
