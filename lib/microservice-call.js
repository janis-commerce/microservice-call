'use strict';

const { promisify } = require('util');
const request = promisify(require('request'));
const RouterFetcher = require('@janiscommerce/router-fetcher');
const Settings = require('@janiscommerce/settings');
const MicroServiceCallError = require('./microservice-call-error');

const API_KEY = 'apiKey';

/**
 * Response of microservice.
 * @typedef {Object} MicroServiceCallResponse
 * @param {Number} StatusCode The status code of the response.
 * @param {String} StatusMessage The status message of the response.
 * @param {Object} headers The headers of the response.
 * @param {Object|String} body The body of the response (string if is '')
 */

/**
 * @class MicroServiceCall
 * @classdesc Use this to make request to microservices.
 */
class MicroServiceCall {

	static get apiKeyField() {
		return API_KEY;
	}

	get apiKey() {

		if(!this._apiKey) {
			const apiKey = Settings.get(this.constructor.apiKeyField);
			if(!apiKey)
				throw new MicroServiceCallError('Invalid Api Key Settings', MicroServiceCallError.codes.INVALID_API_KEY_SETTING);
			this._apiKey = apiKey;
		}
		return this._apiKey;
	}

	constructor() {
		this.routerFetcher = new RouterFetcher();
	}

	/**
	 * Get the basic headers of that will be set in the request to the ms.
	 * @return {Object}
	 */
	getBasicHeaders() {

		const basic = {
			'Content-Type': 'application/json',
			'x-api-key': this.apiKey
		};

		return basic;
	}

	/**
	 * Get the endpoint data doing one request to the router.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {String} httpMethod Verb of the request.
	 * @return {Promise<RouterResponse>}
	 */
	_getEndpointData(service, namespace, method, httpMethod = null) {
		return this.routerFetcher.getEndpoint(service, namespace, method, httpMethod);
	}

	/**
	 * Check if the service, namespace, method and httpMethod are valid and make the request to the correct ms.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @param  {String} httpMethod The httpMethod executed.
	 * @return {Promise<MicroServiceCallResponse>}
	 */
	async _call(service, namespace, method, requestData, requestHeaders, httpMethod, endpointParameters) {
		const { endpoint, httpMethod: httpVerb } = await this._getEndpointData(service, namespace, method, httpMethod);
		return this._makeRequest(endpoint, httpVerb, requestData, requestHeaders, endpointParameters);
	}

	/**
	 * Get the url of microservice with the endpoint parameters.
	 * @return {String}
	 */
	_getUrlWithEndpointParameters(endpoint, endpointParameters) {
		return Object.keys(endpointParameters).reduce((acum, endpointParam) => {
			return endpoint.replace(`{${endpointParam}}`, endpointParameters[endpointParam]);
		}, endpoint);
	}

	/**
	 * Make the request with all the necessary data.
	 * @param  {String} apiEndpoint The api endpoint returned by the router.
	 * @param  {String} httpMethod The httpMethod executed.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */
	async _makeRequest(apiEndpoint, httpMethod, requestData, requestHeaders, endpointParameters = {}) {

		let qs;
		let requestBody;
		if(['GET', 'DELETE'].includes(httpMethod.toUpperCase()))
			qs = requestData;

		if(['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase()))
			requestBody = requestData;

		try {
			const { headers, statusCode, statusMessage, body } = await request({
				url: this._getUrlWithEndpointParameters(apiEndpoint, endpointParameters),
				headers: {
					...this.getBasicHeaders(),
					...requestHeaders
				},
				body: requestBody,
				qs,
				json: true,
				method: httpMethod
			});

			if(statusCode >= 400)
				throw new MicroServiceCallError('Microservice failed', MicroServiceCallError.codes.MICROSERVICE_FAILED);

			return ({
				headers,
				statusCode,
				statusMessage,
				body
			});


		} catch(error) {

			if(error.name === 'MicroServiceCallError')
				throw error;

			throw new MicroServiceCallError(error, MicroServiceCallError.codes.REQUEST_LIB_ERROR);
		}
	}

	/**
	 * Make a get request to an microservice
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */
	get(service, namespace, method, requestData = null, requestHeaders = null, endpointParameters) {
		return this._call(service, namespace, method, requestData, requestHeaders, 'GET', endpointParameters);
	}

	/**
	 * Make a post request to an microservice
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */

	post(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		return this._call(service, namespace, method, requestData, requestHeaders, 'POST', endpointParameters);
	}

	/**
	 * Make a put request to an microservice
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */

	put(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		return this._call(service, namespace, method, requestData, requestHeaders, 'PUT', endpointParameters);
	}

	/**
	 * Make a patch request to an microservice
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */

	patch(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		return this._call(service, namespace, method, requestData, requestHeaders, 'PATCH', endpointParameters);
	}

	/**
	 * Make a delete request to an microservice
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @return {Promise<MicroServiceCallResponse>}
	 */

	delete(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		return this._call(service, namespace, method, requestData, requestHeaders, 'DELETE', endpointParameters);
	}

}

module.exports = MicroServiceCall;
