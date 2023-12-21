'use strict';

const { Invoker } = require('@janiscommerce/lambda');
const MicroServiceCallError = require('./microservice-call-error');

let cache = {};

module.exports = class Discovery {

	static async getEndpoint(service, namespace, method) {

		const cacheKey = `${service}.${namespace}.${method}`;

		if(!cache[cacheKey]) {

			const {
				payload: { baseUrl, path, method: httpMethod, errorMessage },
				functionError
			} = await Invoker.serviceCall('discovery', 'GetEndpoint', { service, namespace, method });

			const errorMsg = errorMessage || functionError;

			if(errorMsg)
				throw new MicroServiceCallError(`Service Discovery fails getting endpoint. Error: ${errorMsg}`, MicroServiceCallError.codes.DISCOVERY_ERROR);

			if(!baseUrl || !path || !httpMethod) {
				throw new MicroServiceCallError(
					`Could not get base url, path or method. Base url: ${baseUrl}, path: ${path}, method: ${httpMethod}`,
					MicroServiceCallError.codes.DISCOVERY_ERROR
				);
			}

			const endpoint = `${baseUrl}${path}`;

			cache[cacheKey] = { endpoint, httpMethod };
		}

		return cache[cacheKey];
	}

	static cleanCache() {
		cache = {};
	}
};
