## Migrating to v5 from v4

Version `5.0.0` radically changed the way the package communicates with services.

API requests are no longer used, lambda invocations are now used with :package: [lambda](https://www.npmjs.com/package/@janiscommerce/lambda).

### Changes you **must** do

In case the service is using error codes, it should be modified as follows.

<details>
	<summary>RouterFetcherError and ROUTER_FETCHER_ERROR_CODE</summary>

In `v4`...

```js

const MsCall = require('@janiscommerce/microservice-call');

const msCall = new MsCall();

ROUTER_FETCHER_ERROR_CODE = 4; // this was a magic number

try {

	await msCall.safeCall('srv', 'np', 'md');

} catch(error) {

	if(error.name === 'RouterFetcherError' && error.code === ROUTER_FETCHER_ERROR_CODE)
		throw error;
}
```

In `v5`, the error is an _Object_ of the class `MicroServiceCallError` and the error code is 'ENDPOINT_NOT_FOUND' and can be obtained with the new _static getter_ `errorCodes`.

```js

const MsCall = require('@janiscommerce/microservice-call');

const msCall = new MsCall();

try {

	await msCall.safeCall('srv', 'np', 'md');

} catch(error) {

	if(error.name === 'MicroServiceCallError' && error.code === MsCall.errorCodes.ENDPOINT_NOT_FOUND)
		throw error;
}
```

</details>

<details>
	<summary>shouldRetry()</summary>

The method `shouldRetry()` was deleted completely.

In `v4`

```js

const MsCall = require('@janiscommerce/microservice-call');

const msCall = new MsCall();

const response = await msCall.safeCall('srv', 'np', 'md');

if(msCall.shouldRetry(response))
	throw new Error('Retry');

```

In `v5`

```js

const MsCall = require('@janiscommerce/microservice-call');

const msCall = new MsCall();

const response = await msCall.safeCall('srv', 'np', 'md');

if(response.status >= 500)
	throw new Error('Retry');

```

</details>

<details>
	<summary>Error codes changes</summary>

In `v4` the :package: [router-fetcher](https://www.npmjs.com/package/@janiscommerce/router-fetcher) throws the following errors, in `v5` are thrown by `microservice-call`.

| v4 | v5 | Description |
|----|----|-------------|
| **RouterFetcherError** `INVALID_ROUTER_CONFIG_SETTING` **3** | `INVALID_DISCOVERY_HOST_SETTING` **1** | The setting for Router/Discovery is missing |
| **RouterFetcherError** `ENDPOINT_NOT_FOUND` **4** | `ENDPOINT_NOT_FOUND` **2** | Endpoint not found in Router/Discovery service |
| **RouterFetcherError** `AXIOS_LIB_ERROR` **5** | `ENDPOINT_REQUEST_FAILED` **3** | The request to the Router/Discovery service failed |

In `v4` the following errors were thrown, in `v5` are replaced or not be used anymore

| v4 | v5 | Description |
|----|----|-------------|
| `MICROSERVICE_FAILED` **2** | `MICROSERVICE_FAILED` **4** | The service failed |
| `REQUEST_LIB_ERROR` **3** | **Not exists anymore** | Request library errors |
| `JANIS_SECRET_MISSING` **4** | **Not exists anymore** | The Janis Secret is missing |

</details>

<details>
	<summary>Changed the default pageSize :warning:</summary>

Since lambda function are now used, the default page size is now **1.000** for the methods `list()` and `safeList()`.

This will not break your code, but is important to beware this change.

</details>