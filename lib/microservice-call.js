'use strict';

const { promisify } = require('util');
const request = promisify(require('request'));
const RouterFetcher = require('@janiscommerce/router-fetcher');
const MicroServiceCallError = require('./microservice-call-error');

const NoRetryErrorMessages = [
	': Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
	': Invalid client'
];

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

	constructor() {
		this.routerFetcher = new RouterFetcher();
	}

	get credentialsHeaders() {
		return {
			'janis-api-key': `service-${process.env.JANIS_SERVICE_NAME}`,
			'janis-api-secret': process.env.JANIS_SERVICE_SECRET
		};
	}

	get sessionHeaders() {

		const sessionHeaders = {};

		if(this.session) {

			if(this.session.clientCode)
				sessionHeaders['janis-client'] = this.session.clientCode;

			if(this.session.userId)
				sessionHeaders['x-janis-user'] = this.session.userId;
		}

		return sessionHeaders;
	}

	/**
	 * Get the basic headers of that will be set in the request to the ms.
	 * @return {Object}
	 */
	getBasicHeaders() {

		const basic = {
			'content-type': 'application/json',
			...this.credentialsHeaders,
			...this.sessionHeaders
		};

		return basic;
	}

	/**
	 * Get the endpoint data doing one request to the router.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @return {Promise<RouterResponse>}
	 */
	_getEndpointData(service, namespace, method) {
		return this.routerFetcher.getEndpoint(service, namespace, method);
	}

	/**
	 * Get the url of microservice with the endpoint parameters.
	 * @return {String}
	 */
	_getUrlWithEndpointParameters(endpoint, endpointParameters) {
		return Object.keys(endpointParameters).reduce((acum, endpointParam) => {
			return acum.replace(`{${endpointParam}}`, endpointParameters[endpointParam]);
		}, endpoint);
	}

	/**
	 * Make the request with all the necessary data.
	 * @param  {String} apiEndpoint The api endpoint returned by the router.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @param  {Object} endpointParameters A key value to replace variables in API path
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

			if(statusCode >= 400) {
				const message = (body && (body.message || JSON.stringify(body))) || 'No response body';
				throw new MicroServiceCallError(`Microservice failed (${statusCode}): ${message}`, MicroServiceCallError.codes.MICROSERVICE_FAILED);
			}

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
	 * Check if the service, namespace and method are valid and make the request to the correct ms.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @param  {Object} endpointParameters A key value to replace variables in API path
	 * @return {Promise<MicroServiceCallResponse>}
	 */
	async call(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		const { endpoint, httpMethod } = await this._getEndpointData(service, namespace, method);
		return this._makeRequest(endpoint, httpMethod, requestData, requestHeaders, endpointParameters);
	}

	/**
	 * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters
	 * @param {String} service The name of the microservice
	 * @param {String} namespace The namespace of the microservice
	 * @param {Object} filters The query params to filter/order the list
	 * @returns {Object} Returns the response, in the body the full list of objects
	 */
	async list(service, namespace, filters) {

		const body = [];
		let page = 1;
		let totals = 0;
		let response;

		do {
			response = await this.call(service, namespace, 'list', filters, { 'x-janis-page': page });

			page++;
			totals = response.headers['x-janis-total'];

			body.push(...response.body);
		}
		while(totals - body.length > 0);

		return {
			...response,
			body
		};

	}

	shouldRetry(error) {
		const [, code, message] = error.message.split(/[()]/g);

		return Number(code) >= 500 && !NoRetryErrorMessages.includes(message);
	}
}

module.exports = MicroServiceCall;
