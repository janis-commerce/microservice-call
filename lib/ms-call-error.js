'use strict';

module.exports = class MsCallError extends Error {

	static get codes() {
		return {
			INVALID_DISCOVERY_HOST_SETTING: 1,
			ENDPOINT_NOT_FOUND: 2,
			AXIOS_LIB_ERROR: 3,
			MICROSERVICE_FAILED: 4
		};
	}

	constructor(err, code, statusCode) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.statusCode = statusCode;
		this.name = 'MsCallError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
