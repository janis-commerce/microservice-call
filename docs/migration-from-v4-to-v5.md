## Migrating to v5 from v4

Version `5.0.0` radically changed the way the package communicates with services.

API requests are no longer used, lambda invocations are now used with :package: [lambda](https://www.npmjs.com/package/@janiscommerce/lambda).

### Changes you must do

In case the service is using error codes, it should be modified as follows.

#### RouterFetcherError and ROUTER_FETCHER_ERROR_CODE

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

### Changed the default pageSize :warning:

Since lambda function are now used, the default page size is now 1000 for the methods `list()` and `safeList()`.

This will not break your code, but is important to beware this change.