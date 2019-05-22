'use strict';

class MicroServiceCallError extends Error {
	constructor(statusCode, statusMessage, headers, body) {
		super();
		this.name = 'MicroServiceCallError';
		this.statusCode = statusCode;
		this.statusMessage = statusMessage;
		this.headers = headers;
		this.body = body;
	}
}

module.exports = MicroServiceCallError;
