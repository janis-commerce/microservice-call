export = MicroServiceCall;
declare class MicroServiceCall {
    static get cache(): {};
    routerFetcher: any;
    /**
     * Credential Headers
     * @typedef {Object} CredentialHeaders
     * @property {string} janis-api-key
     * @property {string} janis-api-secret
     */
    /**
     * Get the credentials headers that will be set in the basic headers
     * @return {CredentialHeaders}
     */
    get credentialsHeaders(): {
        "janis-api-key": string;
        "janis-api-secret": string;
    };
    /**
     * Session Headers
     * @typedef {Object} SessionHeaders
     * @property {string} janis-client
     * @property {string} x-janis-user
     */
    /**
     * Get the session headers from session that will be set in the basic headers
     * @return {SessionHeaders}
     */
    get sessionHeaders(): {
        "janis-client": string;
        "x-janis-user": string;
    };
    /**
     * Basic Headers
     * @typedef {Object} BasicHeaders
     * @property {string} content-type
     * @property {string} janis-client
     * @property {string} x-janis-user
     * @property {string} janis-api-key
     * @property {string} janis-api-secret
     */
    /**
     * Get the basic headers of that will be set in the request to the ms.
     * @return {BasicHeaders}
     */
    getBasicHeaders(): {
        "content-type": string;
        "janis-client": string;
        "x-janis-user": string;
        "janis-api-key": string;
        "janis-api-secret": string;
    };
    /**
     * Response of the router.
     * @typedef {Object} RouterResponse
     * @property {string} endpoint - The endpoint of microservice.
     * @property {string} httpMethod - The httpMethod of endpoint.
     */
    /**
     * Get the endpoint data doing one request to the router.
     * @param  {RouterResponse.endpoint} service - The name of microservice.
     * @param  {string} namespace - The namespace of microservice
     * @param  {string} method - The name of method.
     * @return {Promise<RouterResponse>}
     */
    _getEndpointData(service: any, namespace: string, method: string): Promise<{
        /**
         * - The endpoint of microservice.
         */
        endpoint: string;
        /**
         * - The httpMethod of endpoint.
         */
        httpMethod: string;
    }>;
    /**
     * Get the url of microservice with the endpoint parameters.
     * @param {string} endpoint The endpoint of microservice
     * @param {object} endpointParameters A key value to replace variables in API path
     * @return {string}
     */
    _getUrlWithEndpointParameters(endpoint: string, endpointParameters: object): string;
    /**
     * Response of the request.
     * @typedef {Object} RequestResponse
     * @property {string} headers The headers of response.
     * @property {number} httpMethod The http method of response.
     * @property {string} statusMessage The status message of response.
     * @property {*} body The body of response
     */
    /**
     * Make the request with all the necessary data.
     * @param  {string} apiEndpoint The api endpoint returned by the router.
     * @param  {string} httpMethod The httpMethod of endpoint.
     * @param  {*} requestData The data that will send
     * @param  {object} requestHeaders The headers of the request
     * @param  {object} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse>}
     */
    _makeRequest(apiEndpoint: string, httpMethod: string, requestData: any, requestHeaders: object, endpointParameters?: object): Promise<{
        /**
         * The headers of response.
         */
        headers: string;
        /**
         * The http method of response.
         */
        httpMethod: number;
        /**
         * The status message of response.
         */
        statusMessage: string;
        /**
         * The body of response
         */
        body: any;
    }>;
    /**
     * Check if the service, namespace and method are valid and make the request to the correct ms, throws an Error if response's statusCode is 400+.
     * @param  {String} service The name of the microservice.
     * @param  {String} namespace The namespace of the microservice.
     * @param  {String} method The method of microservice.
     * @param  {Object} requestData The data that will send
     * @param  {Object} requestHeaders The headers of the request
     * @param  {Object} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse | MicroServiceCallError>}
     */
    call(service: string, namespace: string, method: string, requestData: any, requestHeaders: any, endpointParameters: any): Promise<MicroServiceCallError | {
        /**
         * The headers of response.
         */
        headers: string;
        /**
         * The http method of response.
         */
        httpMethod: number;
        /**
         * The status message of response.
         */
        statusMessage: string;
        /**
         * The body of response
         */
        body: any;
    }>;
    /**
     * Check if the service, namespace and method are valid and make the request to the correct ms do not throw if Service response 400+ statusCode.
     * @param  {String} service The name of the microservice.
     * @param  {String} namespace The namespace of the microservice.
     * @param  {String} method The method of microservice.
     * @param  {Object} requestData The data that will send
     * @param  {Object} requestHeaders The headers of the request
     * @param  {Object} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse>}
     */
    safeCall(service: string, namespace: string, method: string, requestData: any, requestHeaders: any, endpointParameters: any): Promise<{
        /**
         * The headers of response.
         */
        headers: string;
        /**
         * The http method of response.
         */
        httpMethod: number;
        /**
         * The status message of response.
         */
        statusMessage: string;
        /**
         * The body of response
         */
        body: any;
    }>;
    /**
     * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. Throws an Error if Services response statusCode 400+
     * @param {String} service The name of the microservice
     * @param {String} namespace The namespace of the microservice
     * @param {*} requestData The query params to filter/order the list
     * @param {object} endpointParameters The endpointParameters if needed
     * @param {Number} pageSize The pageSize to use in list api
     * @returns {Promise<RequestResponse>} Returns the response, in the body the full list of objects
     */
    list(service: string, namespace: string, requestData: any, endpointParameters: object, pageSize: number): Promise<{
        /**
         * The headers of response.
         */
        headers: string;
        /**
         * The http method of response.
         */
        httpMethod: number;
        /**
         * The status message of response.
         */
        statusMessage: string;
        /**
         * The body of response
         */
        body: any;
    }>;
    /**
     * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. NOT throws an Error if Services response statusCode 400+
     * @param {String} service The name of the microservice
     * @param {String} namespace The namespace of the microservice
     * @param {*} requestData The query params to filter/order the list
     * @param {object} endpointParameters The endpointParameters if needed
     * @param {Number} pageSize The pageSize to use in list api
     * @returns {Promise<RequestResponse | MicroServiceCallError>} Returns the response, in the body the full list of objects
     */
    safeList(service: string, namespace: string, requestData: any, endpointParameters: object, pageSize: number): Promise<MicroServiceCallError | {
        /**
         * The headers of response.
         */
        headers: string;
        /**
         * The http method of response.
         */
        httpMethod: number;
        /**
         * The status message of response.
         */
        statusMessage: string;
        /**
         * The body of response
         */
        body: any;
    }>;
    /**
     * Indicates if should re-try the call
     * @param {object|MicroServiceError} response MicroService Response or Error
     * @returns {boolean}
     */
    shouldRetry(response?: object | any): boolean;
    /**
     * Get the message from an MicroService Call Error
     * @param {Error} error MicroServiceCallError
     * @returns {string}
     */
    _getMessageFromError(error: Error): string;
    /**
     * Get the message from a MicroServiceCall Response
     * @param {object} response MicroService Response
     * @returns {string}
     */
    _getMessageFromResponse(response: object): string;
}
import MicroServiceCallError = require("./microservice-call-error");
