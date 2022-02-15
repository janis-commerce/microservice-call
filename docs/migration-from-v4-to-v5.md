## Migrating to v5 from v4

Version `5.0.0` radically changed the way the package communicates with services.

API requests are no longer used, lambda invocations are now used with the [lambda](https://www.npmjs.com/package/@janiscommerce/lambda) package.

### Changes you must do

In case the service is using error codes, it should be modified as follows.

#### RouterFetcherError and ROUTER_FETCHER_ERROR_CODE

- in `v4`...

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

- now in `v5` can be

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