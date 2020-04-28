# Microservice Call

[![Build Status](https://travis-ci.org/janis-commerce/microservice-call.svg?branch=master)](https://travis-ci.org/janis-commerce/microservice-call)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/microservice-call/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/microservice-call?branch=master)


The `MicroService Call` module allows the communication between services.

---

## Installation

```
npm install @janiscommerce/microservice-call
```

---

## Configuration

`MicroService Call` uses `Router Fetcher` check its configuration [here](https://www.npmjs.com/package/@janiscommerce/router-fetcher)

## Session
If an [API Session](https://www.npmjs.com/package/@janiscommerce/api-session) is injected, it will inject `janis-client` and `x-janis-user` headers when possible.

## Authentication
It will automatically inject the `janis-api-key` and `janis-api-secret` if `JANIS_SERVICE_NAME` and `JANIS_SERVICE_SECRET` environment variables are set.

---

## API

> :warning: **After version 4.0.0, `get`, `post`, `put`, `path`, `delete` are *REMOVED***  :warning:

### No Safe Mode

These methods **WILL THROW AN ERROR** when response `statusCode` is `400+`.

* `call(service, namespace, method, requestData, requestHeaders, endpointParameters)`

	Make a request to an microservice.

	Returns a `Promise` of `MicroServiceCallResponse`.

* `list(service, namespace, filters)`

	> :warning: **Only available after version 4.0.0**  :warning:

	Make a `LIST` request to an microservice by entity.

	Returns a `Promise` of `MicroServiceCallResponse`, the `body` contains the full list of entity's objects (no need for pagination)

### Safe Mode

> :warning: **Only available after version 4.0.0**  :warning:

These methods **WILL NOT THROW AN ERROR** when response `statusCode` is `400+`.

* `safeCall(service, namespace, method, requestData, requestHeaders, endpointParameters)`

	Make a request to an microservice.

	Returns a `Promise` of `MicroServiceCallResponse`.

* `safeList(service, namespace, filters)`

	Make a `LIST` request to an microservice by entity.

	Returns a `Promise` of `MicroServiceCallResponse`, the `body` contains the full list of entity's objects (no need for pagination)

### Extra

> :warning: **Only available after version 4.0.0**  :warning:

* `shouldRetry(response)`

	Indicates if should re-try the call. It is usefull for Event-Listeners API to avoid unnecessary retries.

	Params: `response` `{MicroServiceCallResponse | MicroServiceCallError}`

	Returns a `Boolean`.


## Parameters

The Parameters used in the API functions.

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
	* The headers of the request as key-value
* `endpointParameters`
	* type: `Object`
	* A key-value mapping between endpoint path variables and their replace value
* `filters`
	* type: `Object`
	* filters and/or orders available in destination Entity's Service
	* example:
	```js
	{ filters: { id: 'some-id', name:'some-name' }}
	```

## Response Object

Response of Microservices

* `MicroServiceCallResponse`:
	type: `Object`

	* `statusCode`:
		* type: `Number`
		* The status code of the response.
	* `statusMessage`:
		* type: `String`
		* The status message of the response.
	* `headers`:
		* type: `Object`
		* The headers of the response.
	* `body`:
		* type: `Object`, `Array` or `String` (if it's "")
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
	* `statusCode`:
		* type: `Number`
		* The status code of the response.

### Codes

The codes are the following:

| Code | Description |
|-----|-----------------------------|
| 2 | Microservice Failed |
| 3 | Request Library Errors |

---

## Usage

### No Safe Mode

#### CALL

```javascript
const MicroServiceCall = require('@janiscommerce/microservice-call');

const ms = new MicroServiceCall();

// Make a GET request to ms "sac" with the namespace "claim-type" and method "get".
try {
	const response = await ms.call('sac', 'claim-type', 'get', null, null, {
		foo: 'bar'
	});
	/*
		Response example
		{
			headers: {}, // The headers of the response.
			statusCode: 200,
			statusMessage: 'Ok',
			body: {
				foo: 'bar',
				id: 'foo-id',
				other: 100
			}
		}
	*/

} catch(error){
	/*
		Error Response Example:
		{
			name: 'MicroServiceCallError'
			message: 'Could not found claim',
			code: 2,
			statusCode: 404
		}
	*/

	if(ms.shouldRetry(error)) // false
		throw new Error('Should Retry')

	// Do something
}
```

#### LIST

```javascript
const MicroServiceCall = require('@janiscommerce/microservice-call');

const ms = new MicroServiceCall();

// Make a LIST request to ms "catalog" with the namespace "brand" with status filter
try {
	const filters = {
		status: 'active'
	};

	const response = await ms.list('catalog', 'brand', { filters });
	/*
		Response example
		{
			headers: {}, // The headers of the response.
			statusCode: 200,
			statusMessage: 'Ok',
			body: [
				{
					id: 'brand-1',
					referenceId: 'reference-id-1',
					name: 'Brand One'
				},
				{
					id: 'brand-2',
					referenceId: 'reference-id-2',
					name: 'Brand Two'
				},
				// 1997 objects ...
				{
					id: 'brand-2000',
					referenceId: 'reference-id-2000',
					name: 'Brand Two Thousands'
				}
			]
		}
	*/

} catch(err){
	/*
		Error Response Example:
		{
			name: 'MicroServiceCallError'
			message: 'Database Fails',
			code: 2,
			statusCode: 500
		}
	*/

	if(ms.shouldRetry(error)) // true
		throw new Error('Service Call Fails. Should Retry')

	// Do something
}
```

### Safe Mode

#### CALL

```javascript
const MicroServiceCall = require('@janiscommerce/microservice-call');

const ms = new MicroServiceCall();

// Make a GET request to ms "pricing" with the namespace "base-price" and method "get".

const response = await ms.safeCall('pricing', 'base-price', 'get', null, null, {
	foo: 'bar'
});
/*
	Response example
	{
		headers: {}, // The headers of the response.
		statusCode: 504,
		statusMessage: null,
		body: {
			message: 'Timeout'
		}
	}
*/

if(ms.shouldRetry(response)) // true
	throw new Error('Should Retry')

// Do something


// Make a POST request to ms "wms" with the namespace "stock" and method "post".

const response = await ms.safeCall('wms', 'stock', 'post', { name: 'stock-1', quantity: 1 });
/*
	Response example
	{
		headers: {}, // The headers of the response.
		statusCode: 200,
			statusMessage: 'Ok',
			body: {
				id: 'stock-id-1'
			}
	}
*/

if(ms.shouldRetry(response)) // false
	throw new Error('Should Retry')

// Do something

```

#### LIST

```javascript
const MicroServiceCall = require('@janiscommerce/microservice-call');

const ms = new MicroServiceCall();

// Make a LIST request to ms "commerce" with the namespace "seller" with status filter

const filters = {
	status: 'active'
};

const response = await ms.list('commerce', 'seller', { filters });
/*
	Response example
	{
		headers: {}, // The headers of the response.
		statusCode: 200,
		statusMessage: 'Ok',
		body: [
			{
				id: 'seller-1',
				referenceId: 'reference-id-1',
				name: 'Seller One'
			},
			{
				id: 'seller-2',
				referenceId: 'reference-id-2',
				name: 'Seller Two'
			},
			// 1997 objects ...
			{
				id: 'seller-2000',
				referenceId: 'reference-id-2000',
				name: 'Seller Two Thousands'
			}
		]
	}
*/

if(ms.shouldRetry(error)) // false
	throw new Error('Service Call Fails. Should Retry')

// Do something

```