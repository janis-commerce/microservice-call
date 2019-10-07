'use strict';

class MicroServiceCallError extends Error {

	static get codes() {
		return {
			INVALID_API_KEY_SETTING: 1,
			MICROSERVICE_FAILED: 2,
			REQUEST_LIB_ERROR: 3
		};
	}

	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'MicroServiceCallError';

		if(err instanceof Error)
			this.previousError = err;
	}
}

module.exports = MicroServiceCallError;
