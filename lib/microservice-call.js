'use strict';

const axios = require('axios').default;
const { stringify } = require('qs');
const Discovery = require('./discovery');

const MicroServiceCallError = require('./microservice-call-error');
const SecretFetcher = require('./secret-fetcher');

const NoRetryErrorMessages = [
	': Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
	': Invalid client'
];

const DEFAULT_PAGE_SIZE = 60;

/**
 * Credential Headers
 * @typedef {Object} CredentialHeaders
 * @property {string} janis-api-key
 * @property {string} janis-api-secret
 */

/**
 * Session Headers
 * @typedef {Object} SessionHeaders
 * @property {string?} janis-client
 * @property {string?} x-janis-user
 */

/**
 * Basic Headers
 * @typedef {Object} BasicHeaders
 * @property {string} content-type
 * @property {string?} janis-client
 * @property {string?} x-janis-user
 * @property {string} janis-api-key
 * @property {string} janis-api-secret
 */

/**
 * Response of the request.
 * @typedef {Object} RequestResponse
 * @property {Headers} headers The headers of response.
 * @property {number} statusCode The http status code of response.
 * @property {string} statusMessage The status message of response.
 * @property {*} body The body of response
 */

/** @typedef {Object<string,*>} RequestData The data of an request */

/** @typedef {Object<string,string>} Headers The headers of an request or response*/

/** @typedef {Object<string,string|number>} EndpointParameters A key value to replace variables in an API path */

/**
 * @class MicroServiceCall
 * @classdesc Use this to make request to a Janis Microservice.
 */
module.exports = class MicroServiceCall {

	/**
	 * Get the credentials headers that will be set in the basic headers
	 *
	 * @returns {CredentialHeaders}
	 */
	get credentialsHeaders() {

		const servicePart = `service-${process.env.JANIS_SERVICE_NAME}`;

		const userPart = this.apiKeyUser ? `_user-${this.apiKeyUser}` : '';

		return {
			'janis-api-key': `${servicePart}${userPart}`,
			'janis-api-secret': SecretFetcher.secretValue
		};
	}

	/**
	 * Get the session headers from session that will be set in the basic headers
	 *
	 * @returns {SessionHeaders}
	 */
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
	 * Set userId for make api-key header
	 * @param {string} userId User identifier
	 * @returns {MicroServiceCall}
	 */
	setUserId(userId) {

		this.apiKeyUser = userId;

		return this;
	}

	/**
	 * Get the basic headers of that will be set in the request to the ms.
	 *
	 * @returns {BasicHeaders}
	 */
	getBasicHeaders() {

		const basic = {
			'content-type': 'application/json',
			...this.credentialsHeaders,
			...this.sessionHeaders
		};

		// clear user id for api key
		this.apiKeyUser = null;

		return basic;
	}

	/**
	 * Get the url of microservice with the endpoint parameters.
	 *
	 * @private
	 * @param {string} endpoint The endpoint of microservice
	 * @param {EndpointParameters} endpointParameters A key value to replace variables in API path
	 * @returns {string}
	 */
	_getUrlWithEndpointParameters(endpoint, endpointParameters) {
		return endpointParameters
			? Object.keys(endpointParameters).reduce((endpointWithParameters, endpointParam) => {
				return endpointWithParameters.replace(`{${endpointParam}}`, endpointParameters[endpointParam]);
			}, endpoint)
			: endpoint;
	}

	/**
	 * Make the request with all the necessary data.
	 *
	 * @param  {string} apiEndpoint The api endpoint returned by Discovery.
	 * @param  {string} httpMethod The httpMethod of endpoint.
	 * @param  {RequestData | Array<RequestData>} requestData The data that will send
	 * @param  {Headers} requestHeaders The headers of the request
	 * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
	 * @returns {Promise<RequestResponse>}
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

			const { data, status, statusText, headers } = await axios.request({
				url: this._getUrlWithEndpointParameters(apiEndpoint, endpointParameters),
				headers: {
					...this.getBasicHeaders(),
					...requestHeaders
				},
				data: requestBody,
				params: qs,
				method: httpMethod,
				validateStatus: () => true,
				paramsSerializer: /* istanbul ignore next: Cannot test axios callbacks */ params => stringify(params, {
					encodeValuesOnly: true,
					arrayFormat: 'indices'
				})
			});

			return {
				headers,
				statusCode: status,
				statusMessage: statusText,
				body: data
			};
		} catch(error) {

			if(error.constructor.name === 'MicroServiceCallError')
				throw error;

			throw new MicroServiceCallError(error, MicroServiceCallError.codes.REQUEST_LIB_ERROR);
		}
	}

	/**
	 * Check if the service, namespace and method are valid and make the request to the correct ms, throws an Error if response's statusCode is 400+.
	 *
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {RequestData | Array<RequestData>} requestData The data that will send
	 * @param  {Headers} requestHeaders The headers of the request
	 * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
	 * @throws {MicroServiceCallError} When the request fails (status code >= 400)
	 * @returns {Promise<RequestResponse>}
	 */
	async call(service, namespace, method, requestData, requestHeaders, endpointParameters) {

		const { endpoint, httpMethod } = await Discovery.getEndpoint(service, namespace, method);

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
	 *
	 * @param  {String} service The name of the microservice.
	 * @param  {String} namespace The namespace of the microservice.
	 * @param  {String} method The method of microservice.
	 * @param  {RequestData | Array<RequestData>} requestData The data that will send
	 * @param  {Headers} requestHeaders The headers of the request
	 * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
	 * @returns {Promise<RequestResponse>}
	 */
	async safeCall(service, namespace, method, requestData, requestHeaders, endpointParameters) {

		const { endpoint, httpMethod } = await Discovery.getEndpoint(service, namespace, method);

		return this._makeRequest(endpoint, httpMethod, requestData, requestHeaders, endpointParameters);
	}

	/**
	 * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. Throws an Error if Services response statusCode 400+
	 *
	 * @param {String} service The name of the microservice
	 * @param {String} namespace The namespace of the microservice
	 * @param {RequestData} requestData The query params to filter/order the list
	 * @param {EndpointParameters} endpointParameters The endpointParameters if needed
	 * @param {Number} pageSize The pageSize to use in list api
	 * @returns {Promise<RequestResponse>} Returns the response, in the body the full list of objects
	 */
	async list(service, namespace, requestData = null, endpointParameters, pageSize) {

		pageSize = pageSize || DEFAULT_PAGE_SIZE;

		return this.listIterate(service, namespace, requestData, endpointParameters, pageSize);
	}

	async listIterate(service, namespace, requestData, endpointParameters, pageSize, page = 1, items = [], lastResponse) {

		const method = this.makeSafeCall ? 'safeCall' : 'call';

		const headers = {
			'x-janis-page': page,
			'x-janis-page-size': pageSize,
			'x-janis-totals': false
		};

		const response = await this[method](service, namespace, 'list', requestData, headers, endpointParameters);

		if(this.makeSafeCall && response?.statusCode >= 400)
			return response;

		if(response)
			lastResponse = response;

		if(response?.body)
			items.push(...response.body);

		if(response?.body.length === pageSize)
			return this.listIterate(service, namespace, requestData, endpointParameters, pageSize, page + 1, items, lastResponse);

		return {
			...lastResponse,
			body: items
		};
	}

	async safeList(service, namespace, requestData = null, endpointParameters, pageSize) {

		this.makeSafeCall = true;

		const response = await this.list(service, namespace, requestData, endpointParameters, pageSize);

		this.makeSafeCall = false;

		return response;
	}

	/**
	 * Indicates if should re-try the call
	 *
	 * @param {RequestResponse|MicroServiceCallError} response MicroService Response or Error
	 * @returns {boolean}
	 */
	shouldRetry(response = {}) {

		if(!response.statusCode)
			return true;

		const message = response instanceof MicroServiceCallError ?
			this._getMessageFromError(response) :
			this._getMessageFromResponse(response);

		return response.statusCode >= 500 && !NoRetryErrorMessages.includes(message);
	}

	/**
	 * Get the message from an MicroService Call Error
	 *
	 * @private
	 * @param {MicroServiceCallError} error MicroServiceCallError
	 * @returns {string}
	 */
	_getMessageFromError(error) {
		const [, , message] = error.message.split(/[()]/g);
		return message;
	}

	/**
	 * Get the message from a MicroServiceCall Response
	 *
	 * @private
	 * @param {RequestResponse} response MicroService Response
	 * @returns {string}
	 */
	_getMessageFromResponse(response) {
		return (response.body && response.body.message) ? `: ${response.body.message}` : '';
	}

};
