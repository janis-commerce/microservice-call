'use strict';

const request = require('request');
const apiKey = require('./../config/api-key');
const { endpoint, schema } = require('./../config/router');

const { MicroServiceCallInvalidService } = require('../microservicecall');

/**
 * @class RouterFetcher
 * @classdesc Use this to make request to the router.
 */
class RouterFetcher {

	/**
	 * @param  {String} janisClient
	 */
	constructor(janisClient) {
		this.janisClient = janisClient;
	}

	/**
	 * Get the endpoint data doing one request to the router.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {String} httpMethod Verb of the request.
	 * @return {Promise<RouterResponse>}
	 */

	getEndpoint(service, namespace, method, httpMethod) {
		const qs = { namespace, method, service };

		if(httpMethod)
			qs.httpMethod = httpMethod;

		const requestHeaders = {
			'Content-Type': 'application/json',
			'x-api-key': apiKey
		};

		if(this.janisClient)
			requestHeaders['Janis-Client'] = this.janisClient;

		return new Promise((resolve, reject) => {
			request({
				url: endpoint,
				headers: requestHeaders,
				qs,
				method: 'GET',
				json: true
			}, (err, httpResponse, body) => {
				if(err)
					return reject(err);

				if(httpResponse.statusCode >= 400) {
					const { headers, statusCode, statusMessage } = httpResponse;
					return reject(new MicroServiceCallInvalidService(statusCode, statusMessage, headers, body));
				}

				resolve(body);
			});
		});
	}

	/**
	 * Get the schema data of a service doing one request to the router.
	 * @param  {String} service The name of the microservice.
	 * @return {Promise<RouterResponse>}
	 */

	getSchema(service) {

		const requestHeaders = {
			'Content-Type': 'application/json',
			'x-api-key': apiKey
		};

		return new Promise((resolve, reject) => {
			request({
				url: schema.replace('{serviceName}', service),
				headers: requestHeaders,
				method: 'GET',
				json: true
			}, (err, httpResponse, body) => {

				if(err)
					return reject(err);

				if(httpResponse.statusCode >= 400) {
					const { headers, statusCode, statusMessage } = httpResponse;
					return reject(new MicroServiceCallInvalidService(statusCode, statusMessage, headers, body));
				}

				resolve(body);
			});
		});
	}
}

module.exports = RouterFetcher;
