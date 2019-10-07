'use strict';

const assert = require('assert');

const MicroServiceCallError = require('../lib/microservice-call-error');

describe('Router Fetcher Error', () => {

	it('Should accept a message error and a code', () => {
		const error = new MicroServiceCallError('Some error', MicroServiceCallError.codes.MICROSERVICE_FAILED);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, MicroServiceCallError.codes.MICROSERVICE_FAILED);
		assert.strictEqual(error.name, 'MicroServiceCallError');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new MicroServiceCallError(previousError, MicroServiceCallError.codes.MICROSERVICE_FAILED);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, MicroServiceCallError.codes.MICROSERVICE_FAILED);
		assert.strictEqual(error.name, 'MicroServiceCallError');
		assert.strictEqual(error.previousError, previousError);
	});
});
