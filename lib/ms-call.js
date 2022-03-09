'use strict';

const { Invoker } = require('@janiscommerce/lambda');

const MicroServiceCallError = require('./ms-call-error');

const EndpointFetcher = require('./endpoint-fetcher');

const NoRetryErrorMessages = [
	': Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
	': Invalid client'
];

const DEFAULT_LIST_PAGE_SIZE = 1000;

const HEADER_PAGE_SIZE = 'x-janis-page-size';
const HEADER_PAGE = 'x-janis-page';
const HEADER_TOTAL = 'x-janis-total';

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
 * @class MsCall
 * @classdesc Use this to make request to a Janis Microservice.
 */
module.exports = class MsCall {

	static get errorCodes() {
		return MicroServiceCallError.codes;
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

		const response = await this.invoke(service, namespace, method, requestData, requestHeaders, endpointParameters);

		const { statusCode, body } = response;

		if(statusCode >= 400) {

			const message = (body && (body.message || JSON.stringify(body))) || 'No response body';

			throw new MicroServiceCallError(`Microservice failed (${statusCode}): ${message}`,
				this.constructor.errorCodes.MICROSERVICE_FAILED,
				statusCode);
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
		return this.invoke(service, namespace, method, requestData, requestHeaders, endpointParameters);
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
	async list(service, namespace, requestData = null, endpointParameters, pageSize, useSafeMode = false) {

		const body = [];
		let page = 1;
		let totals = 0;
		let response;

		do {

			const headers = {
				[HEADER_PAGE]: page,
				[HEADER_PAGE_SIZE]: pageSize || DEFAULT_LIST_PAGE_SIZE
			};

			const callMethod = useSafeMode ? 'safeCall' : 'call';

			response = await this[callMethod](service, namespace, 'list', requestData, headers, endpointParameters);

			// eslint-disable-next-line max-len
			if(useSafeMode && response.statusCode >= 400) // on "safeMode" when >=400, otherwise will continue execution, this if() and return avoid that problem
				return response;

			page++;
			totals = response.headers[HEADER_TOTAL];

			body.push(...response.body);

		} while(totals - body.length > 0);

		return {
			...response,
			body
		};
	}

	/**
	 * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. NOT throws an Error if Services response statusCode 400+
	 *
	 * @param {String} service The name of the microservice
	 * @param {String} namespace The namespace of the microservice
	 * @param {RequestData} requestData The query params to filter/order the list
	 * @param {EndpointParameters} endpointParameters The endpointParameters if needed
	 * @param {Number} pageSize The pageSize to use in list api
	 * @returns {Promise<RequestResponse | MicroServiceCallError>} Returns the response, in the body the full list of objects
	 */
	safeList(service, namespace, requestData = null, endpointParameters, pageSize) {
		return this.list(service, namespace, requestData, endpointParameters, pageSize, true);
	}

	/**
	 * Invokes the lambda using @janiscommerce/lambda package
	 *
	 * @private
	 * @param {RequestResponse} response MicroService Response
	 * @returns {string}
	 */
	async invoke(service, namespace, janisMethod, requestData, requestHeaders, endpointParameters = {}) {

		const { path: requestPath, method, lambdaName } = await EndpointFetcher.get(service, namespace, janisMethod);

		const event = {
			requestPath,
			path: endpointParameters,
			method,
			...this.prepareData(method, requestData),
			headers: requestHeaders,
			...this.session && { authorizer: { janisAuth: this.session } }
		};

		return Invoker.apiCall(service, lambdaName, event);
	}

	prepareData(method, requestData) {

		let query;
		let body;

		if(['GET', 'DELETE'].includes(method.toUpperCase()))
			query = requestData;

		if(['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()))
			body = requestData;

		return {
			...query && { query },
			...body && { body }
		};
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
			this.getMessageFromError(response) :
			this.getMessageFromResponse(response);

		return response.statusCode >= 500 && !NoRetryErrorMessages.includes(message);
	}

	/**
	 * Get the message from an MsCall Error
	 *
	 * @private
	 * @param {MicroServiceCallError} error MicroServiceCallError
	 * @returns {string}
	 */
	getMessageFromError(error) {
		const [, , message] = error.message.split(/[()]/g);
		return message;
	}

	/**
	 * Get the message from a MsCall Response
	 *
	 * @private
	 * @param {RequestResponse} response MicroService Response
	 * @returns {string}
	 */
	getMessageFromResponse(response) {
		return (response.body && response.body.message) ? `: ${response.body.message}` : '';
	}
};