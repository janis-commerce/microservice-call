# Microservice Call

![Build Status](https://github.com/janis-commerce/microservice-call/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/microservice-call/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/microservice-call?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fmicroservice-call.svg)](https://www.npmjs.com/package/@janiscommerce/microservice-call)

The `MsCall` module allows the communication between services using :package: [lambda](https://www.npmjs.com/package/@janiscommerce/lambda).

---

## :inbox_tray: Installation

```
npm install @janiscommerce/microservice-call
```

---

## :hammer_and_wrench: Configuration

`MsCall` uses the **Discovery Service** to find Endpoints using `service`, `namespace` and `method`.

It's required to configure the setting `discoveryHost` using :package: [settings](https://www.npmjs.com/package/@janiscommerce/settings).

## Session

If an [api-session](https://www.npmjs.com/package/@janiscommerce/api-session) is injected, it will send the information to the lambda function.

---

## Migration guide to v5

If you are looking for a migration guide from v4 to v5, here it is: [migration-from-v4-to-v5](https://github.com/janis-commerce/microservice-call/tree/master/docs/migration-from-v4-to-v5.md)

---

## API

### Regular Mode :warning:

These methods **WILL THROW AN ERROR** when response `statusCode` is `400+`.

* `call(service, namespace, method, requestData, requestHeaders, endpointParameters)`

	Make a request to a microservice.

	Returns a `Promise` of `MicroServiceCallResponse`.

* `list(service, namespace, requestData, endpointParameters, pageSize)`

	_Since 4.0.0_

	Make a `LIST` request to a microservice by entity.

	Returns a `Promise` of `MicroServiceCallResponse`, the `body` contains the full list of entity's objects (no need for pagination)

### Safe Mode

_Since 4.0.0_

These methods **WILL NOT THROW AN ERROR** when response `statusCode` is `400+`.

* `safeCall(service, namespace, method, requestData, requestHeaders, endpointParameters)`

	Make a request to a microservice.

	Returns a `Promise` of `MicroServiceCallResponse`.

* `safeList(service, namespace, requestData, endpointParameters, pageSize)`

	Make a `LIST` request to a microservice by entity.

	Returns a `Promise` of `MicroServiceCallResponse`, the `body` contains the full list of entity's objects (no need for pagination)

### Extra

* `static get errorCodes()` _Since 5.0.0_

	Retrieves the MicroserviceCallError codes.

	Returns an `Object` with error codes, see Errors section bellow.

	```js
		const MsCall = require('@janiscommerce/microservice-call');

		console.log(MsCall.errorCodes.ENDPOINT_NOT_FOUND); // expected output: 2
	```

## Parameters

The Parameters used in the API functions.

* `service`
	* type: `String`
	* The name of the microservice.
* `namespace`
	* type: `String`
	* The namespace or entity.
* `method`
	* type: `String`
	* The method for the namespace or entity.
* `requestData`
	* type: `Object`
	* The data that will send.
* `requestHeaders`
	* type: `Object`
	* The headers of the request as key-value.
* `endpointParameters`
	* type: `Object`
	* A key-value mapping between endpoint path variables and their replace value.
* `filters`
	* type: `Object`
	* filters and/or orders available in destination Entity's Service.
	* example:
	```js
		{ filters: { id: 'some-id', name:'some-name' }}
	```
* `pageSize`. _Since 4.3.2_
	* type: `Number`
	* The page size will be use to add the `x-janis-page-size` header to the **ApiList**. The default value is `1000`.

## Response Object

Response of Microservice

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

## :warning: Errors

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

| Code | Code Number | Description |
|------|-------------|-------------|
| `INVALID_DISCOVERY_HOST_SETTING` | 1 | Missing setting `discoveryHost` |
| `ENDPOINT_NOT_FOUND` | 2 | Endpoint not found in Discovery Service |
| `ENDPOINT_REQUEST_FAILED` | 3 | The request to Discovery Service failed |
| `MICROSERVICE_FAILED` | 4 | The request to Service failed |

---

## :page_with_curl: Usage

### No Safe Mode

<details>
	<summary>Making a regular call using the method <code>call()</code>.</summary>

```javascript
const MsCall = require('@janiscommerce/microservice-call');

const ms = new MsCall();

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

} catch(error) {
	/*
		Error Response Example:
		{
			name: 'MicroServiceCallError'
			message: 'Could not found claim',
			code: 4,
			statusCode: 404
		}
	*/
}
```
</details>

<details>
	<summary>Making a regular list call using the method <code>list()</code>.</summary>

```javascript
const MsCall = require('@janiscommerce/microservice-call');

const ms = new MsCall();

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

} catch(err) {
	/*
		Error Response Example:
		{
			name: 'MicroServiceCallError'
			message: 'Database Fails',
			code: 4,
			statusCode: 500
		}
	*/
}
```

</details>

### Safe Mode

<details>
	<summary>Making a "safe" call using the method <code>safeCall()</code>.</summary>

```javascript
const MsCall = require('@janiscommerce/microservice-call');

const ms = new MsCall();

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

if(response.status >= 500) // true
	throw new Error('Should Retry');

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

if(response.status >= 500) // false
	throw new Error('Should Retry');

// Do something

```

</details>

<details>
	<summary>Making a "safe" list call using the method <code>safeList()</code>.</summary>


```javascript
const MsCall = require('@janiscommerce/microservice-call');

const ms = new MsCall();

// Make a LIST request to ms "commerce" with the namespace "seller" with status filter

const filters = {
	status: 'active'
};

const response = await ms.safeList('commerce', 'seller', { filters });
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

if(response.status >= 500) // false
	throw new Error('Service Call Fails. Should Retry');

// Do something

```
</details>