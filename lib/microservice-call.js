'use strict';

const { promisify } = require('util');
const request = promisify(require('request'));
const RouterFetcher = require('@janiscommerce/router-fetcher');
const MicroServiceCallError = require('./microservice-call-error');
const SecretFetcher = require('./secret-fetcher');

const NoRetryErrorMessages = [
	': Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
	': Invalid client'
];

const DEFAULT_PAGE_SIZE = 60;

/**
 * @class MicroServiceCall
 * @classdesc Use this to make request to a Janis Microservice.
 */
module.exports = class MicroServiceCall {

	constructor() {
		this.routerFetcher = new RouterFetcher();
	}

	static get cache() {
		if(!this._cache)
			this._cache = {};

		return this._cache;
	}

	get credentialsHeaders() {
		return {
			'janis-api-key': `service-${process.env.JANIS_SERVICE_NAME}`,
			'janis-api-secret': SecretFetcher.secretValue
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

		const cacheKey = `${service}-${namespace}-${method}`;

		if(!this.constructor.cache[cacheKey])
			this.constructor.cache[cacheKey] = this.routerFetcher.getEndpoint(service, namespace, method);

		return this.constructor.cache[cacheKey];
	}

	/**
	 * Get the url of microservice with the endpoint parameters.
	 * @return {String}
	 */
	_getUrlWithEndpointParameters(endpoint, endpointParameters) {
		return Object.keys(endpointParameters).reduce((endpointWithParameters, endpointParam) => {
			return endpointWithParameters.replace(`{${endpointParam}}`, endpointParameters[endpointParam]);
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

			await SecretFetcher.fetch();

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

			return {
				headers,
				statusCode,
				statusMessage,
				body
			};
		} catch(error) {

			if(error.constructor.name === 'MicroServiceCallError')
				throw error;

			throw new MicroServiceCallError(error, MicroServiceCallError.codes.REQUEST_LIB_ERROR);
		}
	}

	/**
	 * Check if the service, namespace and method are valid and make the request to the correct ms, throws an Error if response's statusCode is 400+.
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
		const response = await this._makeRequest(endpoint, httpMethod, requestData, requestHeaders, endpointParameters);

		if(response.statusCode >= 400) {
			const message = (response.body && (response.body.message || JSON.stringify(response.body))) || 'No response body';

			throw new MicroServiceCallError(`Microservice failed (${response.statusCode}): ${message}`,
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				response.statusCode);
		}

		return response;
	}

	/**
	 * Check if the service, namespace and method are valid and make the request to the correct ms do not throw if Service response 400+ statusCode.
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {Object} requestData The data that will send
	 * @param  {Object} requestHeaders The headers of the request
	 * @param  {Object} endpointParameters A key value to replace variables in API path
	 * @return {Promise<MicroServiceCallResponse>}
	 */
	async safeCall(service, namespace, method, requestData, requestHeaders, endpointParameters) {
		const { endpoint, httpMethod } = await this._getEndpointData(service, namespace, method);
		return this._makeRequest(endpoint, httpMethod, requestData, requestHeaders, endpointParameters);
	}

	/**
	 * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. Throws an Error if Services response statusCode 400+
	 * @param {String} service The name of the microservice
	 * @param {String} namespace The namespace of the microservice
	 * @param {Object} requestData The query params to filter/order the list
	 * @param {Object} endpointParameters The endpointParameters if needed
	 * @param {Number} pageSize The pageSize to use in list api
	 * @returns {Object} Returns the response, in the body the full list of objects
	 */
	async list(service, namespace, requestData = null, endpointParameters, pageSize) {

		const body = [];
		let page = 1;
		let totals = 0;
		let response;

		do {

			const headers = {
				'x-janis-page': page,
				'x-janis-page-size': pageSize || DEFAULT_PAGE_SIZE
			};

			response = await this.call(service, namespace, 'list', requestData, headers, endpointParameters);

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

	/**
	 * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. NOT throws an Error if Services response statusCode 400+
	 * @param {String} service The name of the microservice
	 * @param {String} namespace The namespace of the microservice
	 * @param {Object} requestData The query params to filter/order the list
	 * @param {Object} endpointParameters The endpointParameters if needed
	 * @param {Number} pageSize The pageSize to use in list api
	 * @returns {Object} Returns the response, in the body the full list of objects
	 */
	async safeList(service, namespace, requestData = null, endpointParameters, pageSize) {

		const body = [];
		let page = 1;
		let totals = 0;
		let response;

		do {

			const headers = {
				'x-janis-page': page,
				'x-janis-page-size': pageSize || DEFAULT_PAGE_SIZE
			};

			response = await this.safeCall(service, namespace, 'list', requestData, headers, endpointParameters);

			if(response.statusCode >= 400)
				return response;

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

	/**
	 * Indicates if should re-try the call
	 * @param {object|MicroServiceError} response MicroService Response or Error
	 * @returns {boolean}
	 */
	shouldRetry(response = {}) {

		if(!response.statusCode)
			return true;

		const message = response.name === 'MicroServiceCallError' ?
			this._getMessageFromError(response) :
			this._getMessageFromResponse(response);

		return response.statusCode >= 500 && !NoRetryErrorMessages.includes(message);
	}

	/**
	 * Get the message from an MicroService Call Error
	 * @param {Error} error MicroServiceCallError
	 * @returns {string}
	 */
	_getMessageFromError(error) {
		const [, , message] = error.message.split(/[()]/g);
		return message;
	}

	/**
	 * Get the message from a MicroServiceCall Response
	 * @param {object} response MicroService Response
	 * @returns {string}
	 */
	_getMessageFromResponse(response) {
		return (response.body && response.body.message) ? `: ${response.body.message}` : '';
	}
};
