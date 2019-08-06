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
		super(err);
		this.name = 'MicroServiceCallError';
		this.message = err.message || err;
		this.code = code;
	}
}

module.exports = MicroServiceCallError;
