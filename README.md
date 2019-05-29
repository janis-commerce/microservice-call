# Microservice-Call

The `MicroService-Call` module allows the communication between services. 

## Installation

```
npm install @janiscommerce/microservice-call
```

## API

* `new MicroServiceCall()`

    MicroServiceCall Constructs.

* `getBasicHeaders()`

    Get the basic headers of that will be set in the request to the microservice.

    Returns an `Object`.
    
* `get(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `GET` request to an microservice. 
    
    Returns a `Promise` of `MicroServiceCallResponse`.

* `post(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `POST` request to an microservice. 
    
    Returns a `Promise` of `MicroServiceCallResponse`.

* `put(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `PUT` request to an microservice. 
    
    Returns a `Promise` of `MicroServiceCallResponse`.

* `patch(service, namespace, method, requestData, requestHeaders, endpointParameters)`

    Make a `DELETE` request to an microservice. 
    
    Returns a `Promise` of `MicroServiceCallResponse`.

## Parametres

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
        * type: `Object` or `String` (if is "")
        * The body of the response

## Errors

The errors are informed with a `MicroServiceCallError`.

* `MicroServiceCallError`:
    * `code`: 
        * type: `Number`
        * The status code of the error.
    * `message`:
        * type: `String`
        * The message of the error.
    * `name`: 
        * type: `String`
        * The name of the Error
### Codes

The codes are the following:

|Code	|Description						|
|-----|-----------------------------|
|1		|Invalid Api Key Path						|
|2		|Microservice Failed 				|
|3		|Request Library Errors 	|

## Usage

```javascript
const MicroServiceCall = require('@janiscommerce/microservice-call');

// Instance with "Janis Client"
const ms = new MicroServiceCall('fizzmodarg');

// Make a GET request to ms "sac" with the namespace "claim-type" and method "list".
try {
    const get_data = await ms.get('sac', 'claim-type', 'list', null, null, {
        foo: 'value-1',
        bar: 'value-2'
    });
    /*
        Response example
        {
            headers: {}, // The headers of the response.
            statusCode: 200,
            statusMessage: 'Ok',
            body: [{ foo: 'bar' }]
        }
    */

} catch(err){
    /*
        Error Response Example:
        {
            name: 'MicroServiceCallError'
            message: 'Could not find Microservice',
            code: 2
        }
    */
    if (err)
        // Do something
}
```