export = MicroServiceCall;
declare class MicroServiceCall {
    static get cache(): {};
    routerFetcher: any;
    /**
     * Get the credentials headers that will be set in the basic headers
     * @return {CredentialHeaders}
     */
    get credentialsHeaders(): CredentialHeaders;
    /**
     * Get the session headers from session that will be set in the basic headers
     * @return {SessionHeaders}
     */
    get sessionHeaders(): SessionHeaders;
    /**
     * Get the basic headers of that will be set in the request to the ms.
     * @return {BasicHeaders}
     */
    getBasicHeaders(): BasicHeaders;
    /**
     * Get the endpoint data doing one request to the router.
     * @param  {string} service - The service of microservice
     * @param  {string} namespace - The namespace of microservice
     * @param  {string} method - The name of method.
     * @return {Promise<RouterResponse>}
     */
    _getEndpointData(service: string, namespace: string, method: string): Promise<RouterResponse>;
    /**
     * Get the url of microservice with the endpoint parameters.
     * @param {string} endpoint The endpoint of microservice
     * @param {EndpointParameters} endpointParameters A key value to replace variables in API path
     * @return {string}
     */
    _getUrlWithEndpointParameters(endpoint: string, endpointParameters: EndpointParameters): string;
    /**
     * Make the request with all the necessary data.
     * @param  {string} apiEndpoint The api endpoint returned by the router.
     * @param  {string} httpMethod The httpMethod of endpoint.
     * @param  {*} requestData The data that will send
     * @param  {Headers} requestHeaders The headers of the request
     * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse>}
     */
    _makeRequest(apiEndpoint: string, httpMethod: string, requestData: any, requestHeaders: Headers, endpointParameters?: EndpointParameters): Promise<RequestResponse>;
    /**
     * Check if the service, namespace and method are valid and make the request to the correct ms, throws an Error if response's statusCode is 400+.
     * @param  {String} service The name of the microservice.
     * @param  {String} namespace The namespace of the microservice.
     * @param  {String} method The method of microservice.
     * @param  {*} requestData The data that will send
     * @param  {Headers} requestHeaders The headers of the request
     * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse | MicroServiceCallError>}
     */
    call(service: string, namespace: string, method: string, requestData: any, requestHeaders: Headers, endpointParameters: EndpointParameters): Promise<RequestResponse | MicroServiceCallError>;
    /**
     * Check if the service, namespace and method are valid and make the request to the correct ms do not throw if Service response 400+ statusCode.
     * @param  {String} service The name of the microservice.
     * @param  {String} namespace The namespace of the microservice.
     * @param  {String} method The method of microservice.
     * @param  {*} requestData The data that will send
     * @param  {Headers} requestHeaders The headers of the request
     * @param  {EndpointParameters} endpointParameters A key value to replace variables in API path
     * @return {Promise<RequestResponse>}
     */
    safeCall(service: string, namespace: string, method: string, requestData: any, requestHeaders: Headers, endpointParameters: EndpointParameters): Promise<RequestResponse>;
    /**
     * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. Throws an Error if Services response statusCode 400+
     * @param {String} service The name of the microservice
     * @param {String} namespace The namespace of the microservice
     * @param {*} requestData The query params to filter/order the list
     * @param {EndpointParameters} endpointParameters The endpointParameters if needed
     * @param {Number} pageSize The pageSize to use in list api
     * @returns {Promise<RequestResponse>} Returns the response, in the body the full list of objects
     */
    list(service: string, namespace: string, requestData: any, endpointParameters: EndpointParameters, pageSize: number): Promise<RequestResponse>;
    /**
     * Makes an HTTP GET request with x-janis-method 'list' to the specified service/namespace with the specified filters. NOT throws an Error if Services response statusCode 400+
     * @param {String} service The name of the microservice
     * @param {String} namespace The namespace of the microservice
     * @param {*} requestData The query params to filter/order the list
     * @param {EndpointParameters} endpointParameters The endpointParameters if needed
     * @param {Number} pageSize The pageSize to use in list api
     * @returns {Promise<RequestResponse | MicroServiceCallError>} Returns the response, in the body the full list of objects
     */
    safeList(service: string, namespace: string, requestData: any, endpointParameters: EndpointParameters, pageSize: number): Promise<RequestResponse | MicroServiceCallError>;
    /**
     * Indicates if should re-try the call
     * @param {MicroServiceCallError} response MicroService Response or Error
     * @returns {boolean}
     */
    shouldRetry(response?: MicroServiceCallError): boolean;
    /**
     * Get the message from an MicroService Call Error
     * @param {Error} error MicroServiceCallError
     * @returns {string}
     */
    _getMessageFromError(error: Error): string;
    /**
     * Get the message from a MicroServiceCall Response
     * @param {Object} response MicroService Response
     * @returns {string}
     */
    _getMessageFromResponse(response: any): string;
}
declare namespace MicroServiceCall {
    export { _cache, RouterResponse, CredentialHeaders, SessionHeaders, BasicHeaders, RequestResponse, RequestData, Headers, EndpointParameters };
}
/**
 * Credential Headers
 */
type CredentialHeaders = {
    "janis-api-key": string;
    "janis-api-secret": string;
};
/**
 * Session Headers
 */
type SessionHeaders = {
    "janis-client": string;
    "x-janis-user": string;
};
/**
 * Basic Headers
 */
type BasicHeaders = {
    "content-type": string;
    "janis-client": string;
    "x-janis-user": string;
    "janis-api-key": string;
    "janis-api-secret": string;
};
/**
 * Response of the router.
 */
type RouterResponse = {
    /**
     * - The endpoint of microservice.
     */
    endpoint: string;
    /**
     * - The httpMethod of endpoint.
     */
    httpMethod: string;
};
/**
 * A key value to replace variables in an API path
 */
type EndpointParameters = {
    [x: string]: any;
};
/**
 * The headers of an request or response
 */
type Headers = {
    [x: string]: any;
};
/**
 * Response of the request.
 */
type RequestResponse = {
    /**
     * The headers of response.
     */
    headers: Headers;
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
};
import MicroServiceCallError = require("./microservice-call-error");
declare var _cache: {};
/**
 * The data of an request
 */
type RequestData = any;
