'use strict';

const nock = require('nock');
const sinon = require('sinon');
const assert = require('assert');
const RouterFetcher = require('@janiscommerce/router-fetcher');

const MicroServiceCall = require('../');
const MicroServiceCallError = require('../lib/microservice-call-error');

describe('MicroService call', () => {

	const oldEnv = { ...process.env };

	before(() => {
		process.env.JANIS_SERVICE_NAME = 'dummy-service';
		process.env.JANIS_SERVICE_SECRET = 'dummy-secret';
	});

	after(() => {
		process.env = oldEnv;
	});

	let ms;
	describe('Microservice call', () => {

		beforeEach(() => {
			ms = new MicroServiceCall();
		});

		afterEach(() => {
			sinon.restore();
		});

		it('Should return a RouterFetcherError when no Settings', async () => {
			await assert.rejects(() => ms.get('any', 'any', 'any'), { name: 'RouterFetcherError' });
		});

		it('Should return the correct response object on successful calls', async () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			const mockMsResponse = { name: 'foo' };

			nock('https://localhost')
				.get('/foo/bar')
				.reply(200, mockMsResponse, headersResponse);

			const data = await ms.get('sac', 'claim-type', 'list');

			assert.deepStrictEqual(data, {
				statusCode: 200,
				statusMessage: null,
				body: mockMsResponse,
				headers: headersResponse
			});
		});

		it('Should send the correct values and return the correct values from ms', async () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'POST'
			}));

			const mockMsResponse = { name: 'foo' };

			nock('https://localhost')
				.post('/foo/bar', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data = await ms.post('sac', 'claim-type', 'list', { foo: 'bar' });

			assert.deepStrictEqual(data, {
				statusCode: 200,
				statusMessage: null,
				body: mockMsResponse,
				headers: headersResponse
			});
		});

		it('Should return a MicroServiceCallError when the called microservice returns an error', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			nock('https://localhost')
				.get('/foo/bar')
				.reply(404, {
					message: 'Something failed'
				});

			await assert.rejects(() => ms.get('good', 'good', 'good'),
				{ name: 'MicroServiceCallError', code: MicroServiceCallError.codes.MICROSERVICE_FAILED });
		});

		it('Should use response body `message` prop as error message if present', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			nock('https://localhost')
				.get('/foo/bar')
				.reply(404, {
					message: 'Something failed'
				});

			await assert.rejects(() => ms.get('good', 'good', 'good'),
				{ name: 'MicroServiceCallError', code: MicroServiceCallError.codes.MICROSERVICE_FAILED, message: 'Microservice failed (404): Something failed' });
		});

		it('Should use response body stringified as error message if message prop is not present', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			nock('https://localhost')
				.get('/foo/bar')
				.reply(404, {
					foo: 'bar'
				});

			await assert.rejects(() => ms.get('good', 'good', 'good'),
				{ name: 'MicroServiceCallError', code: MicroServiceCallError.codes.MICROSERVICE_FAILED, message: 'Microservice failed (404): {"foo":"bar"}' });
		});

		it('Should use a generic message as error message if response body is empty', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			nock('https://localhost')
				.get('/foo/bar')
				.reply(404);

			await assert.rejects(() => ms.get('good', 'good', 'good'),
				{ name: 'MicroServiceCallError', code: MicroServiceCallError.codes.MICROSERVICE_FAILED, message: 'Microservice failed (404): No response body' });
		});

		it('Should make the request with the correct path params', async () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'http://localhost/api/alarms/{alarmName}/state/{alarmState}',
				httpMethod: 'POST'
			}));

			const mockMsResponse = { name: 'foo' };

			nock('http://localhost/api/alarms/foo/state/ok')
				.post('', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data = await ms.post('sac', 'claim-type', 'list', { foo: 'bar' }, null, { alarmName: 'foo', alarmState: 'ok' });

			assert.deepStrictEqual(data, {
				statusCode: 200,
				statusMessage: null,
				body: mockMsResponse,
				headers: headersResponse
			});
		});

		it('Should return the lib error when the request library cannot make the call to the ms', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'https://localhost/foo/bar',
				httpMethod: 'get'
			}));

			nock('https://localhost')
				.get('/foo/bar')
				.replyWithError('Some lib error');

			await assert.rejects(ms.post('false', 'false', 'false'), {
				name: 'MicroServiceCallError',
				code: MicroServiceCallError.codes.REQUEST_LIB_ERROR,
				message: 'Some lib error'
			});
		});

		it('Should call private `_call` on put method with correct params', async () => {

			const spy = sinon.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

			await ms.put('a', 'b', 'c', {}, {}, {});

			assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PUT', {}), '_call method not called properly.');
		});

		it('Should call private `_call` on patch method with correct params', async () => {

			const spy = sinon.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

			await ms.patch('a', 'b', 'c', {}, {}, {});

			assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PATCH', {}), '_call method not called properly.');
		});

		it('Should call private `_call` on delete method with correct params', async () => {

			const spy = sinon.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

			await ms.delete('a', 'b', 'c', {}, {}, {});

			assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'DELETE', {}), '_call method not called properly.');
		});

		it('Should call private `_call` on get method with correct params', async () => {

			const spy = sinon.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

			await ms.get('a', 'b', 'c', {}, {}, {});

			assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'GET', {}), '_call method not called properly.');
		});

		it('Should call private `_call` on post method with correct params', async () => {

			const callStub = sinon.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

			await ms.post('a', 'b', 'c', {}, {}, {});

			assert(callStub.calledWithExactly('a', 'b', 'c', {}, {}, 'POST', {}), '_call method not called properly.');
		});

		it('Should call the router fetcher without "httpMethod"', async () => {

			const getEndpointStub = sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({}));

			sinon.stub(MicroServiceCall.prototype, '_makeRequest').callsFake(() => null);

			await ms._call('service', 'namespace', 'method', {}, {});

			assert(getEndpointStub.calledWithExactly('service', 'namespace', 'method', null));
		});

		it('Should make the request with the service name and secret from env variables if constructor arguments are empty', async () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'http://localhost/api/alarms/{alarmName}/state',
				httpMethod: 'POST'
			}));


			const mockMsResponse = { name: 'foo' };

			const reqheaders = {
				'content-type': 'application/json',
				'janis-api-key': 'service-dummy-service',
				'janis-api-secret': 'dummy-secret'
			};

			nock('http://localhost/api/alarms/foo/state', { reqheaders })
				.post('', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			await ms.post('sac', 'claim-type', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });
		});

		it('Should make the request without the janis-client and x-janis-user if an empty session is present', async () => {

			ms.session = {};

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'http://localhost/api/alarms/{alarmName}/state',
				httpMethod: 'POST'
			}));


			const mockMsResponse = { name: 'foo' };

			const reqheaders = {
				'content-type': 'application/json',
				'janis-api-key': 'service-dummy-service',
				'janis-api-secret': 'dummy-secret'
			};

			nock('http://localhost/api/alarms/foo/state', { reqheaders })
				.post('', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			await ms.post('sac', 'claim-type', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });
		});

		it('Should make the request with the janis-client and x-janis-user if session is present', async () => {

			ms.session = {
				clientCode: 'fizzmod',
				userId: 'dummy-user-id'
			};

			const headersResponse = {
				'content-type': 'application/json'
			};

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
				endpoint: 'http://localhost/api/alarms/{alarmName}/state',
				httpMethod: 'POST'
			}));


			const mockMsResponse = { name: 'foo' };

			const reqheaders = {
				'content-type': 'application/json',
				'janis-api-key': 'service-dummy-service',
				'janis-api-secret': 'dummy-secret',
				'janis-client': 'fizzmod',
				'x-janis-user': 'dummy-user-id'
			};

			nock('http://localhost/api/alarms/foo/state', { reqheaders })
				.post('', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			await ms.post('sac', 'claim-type', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });
		});
	});
});
