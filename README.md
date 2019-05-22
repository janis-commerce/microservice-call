# Microservice-Call

The ´MicroService-Call´ module allows the communication between services. 

## Installation


    npm install @janiscommerce/microservice-call

## Response Object

Response of Microservices

* `MicroServiceCallResponse`:
    * `StatusCode`: 
        * type: `Number`
        * The status code of the response.
    * `StatusMessage`:
        * type: `String`
        * The status message of the response.
    * `headers`:
        * type: `Object`
        * The headers of the response.
    * `body`:
        * type: `Object` or `String` (if is ''if is '')
        * The body of the response

## Params

The Parametres used in the API functions.

* `apiEndpoint`
    * type: `String`
    * The api endpoint returned by the router.
* `service` 
    * type: `String`
    * The name of the microservice.
* `namespace`
    * type: `String`
    * The namespace of the microservice.
* `method` 
    * type: `String`
    * The method of microservice.
* `requestData`
    * type: `Object`
    * The data that will send
* `requestHeaders`
    * type: `Object`
    * The headers of the request

## API

* `new MicroServiceCall( janisClient )`

    MicrosServiceCall Constructs.

* `getBasicHeaders()`

    Get the basic headers of that will be set in the request to the microservice. Returns an `object`
    
* `get(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `get` request to an microservice. Returns a `Promise` of `MicroServiceCallResponse`.

* `post(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `post` request to an microservice. Returns a `Promise` of `MicroServiceCallResponse`.

* `put(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `put` request to an microservice. Returns a `Promise` of `MicroServiceCallResponse`.

* `patch(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a delete request to an microservice. Returns a `Promise` of `MicroServiceCallResponse`.

## Errors

If the request response HTTP Code is 400 or more, the response Object has a key/value 

`name: MicroServiceCallError`.

## Usage

    const MicroServiceCall = require('@janiscommerce/microservice-call');
    // without Janis Client
    const msWithoutJanisClient = new MicroServiceCall();
    // with a Janis Client
    const ms = new MicroServiceCall('fizzmodarg');
    // GET Method
    const get_data = await ms.get('sac', 'claim-type', 'list');
    // POST Method
    const post_data = await ms.post('sac', 'claim-type', 'list', { foo: 'bar' });
    // PATCH
    await ms.patch('a', 'b', 'c', {}, {}, {});
    // DELETE
    await ms.delete('a', 'b', 'c', {}, {}, {})
