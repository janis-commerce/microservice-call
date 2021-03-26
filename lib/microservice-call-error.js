'use strict';

module.exports = class MicroServiceCallError extends Error {

	static get codes() {
		return {
			MICROSERVICE_FAILED: 2,
			REQUEST_LIB_ERROR: 3,
			JANIS_SECRET_MISSING: 4
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
