'use strict';

const MicroServiceCallError = require('./microservice-call-error');

class MicroServiceCallInvalidService extends MicroServiceCallError {
	constructor(statusCode, statusMessage, headers, body) {
		super(statusCode, statusMessage, headers, body);
		this.name = 'MicroServiceCallInvalidService';
	}
}

module.exports = MicroServiceCallInvalidService;