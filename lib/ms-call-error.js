'use strict';

module.exports = class MicroServiceCallError extends Error {

	static get codes() {
		return {
			INVALID_DISCOVERY_HOST_SETTING: 1,
			ENDPOINT_NOT_FOUND: 2,
			ENDPOINT_REQUEST_FAILED: 3,
			MICROSERVICE_FAILED: 4
		};
	}

	constructor(err, code, statusCode) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.statusCode = statusCode;
		this.name = 'MicroServiceCallError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
