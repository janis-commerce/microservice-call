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

	beforeEach(() => {
		ms = new MicroServiceCall();
	});

	afterEach(() => {
		sinon.restore();
		MicroServiceCall._cache = {}; // eslint-disable-line
	});

	describe('Call', () => {

		context('When request fails', () => {

			it('Should return a RouterFetcherError when no Settings', async () => {
				await assert.rejects(() => ms.call('any', 'any', 'any'), { name: 'RouterFetcherError' });
			});

			it('Should return a MicroServiceCallError when the called microservice returns an error', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://localhost/foo/bar',
					httpMethod: 'get'
				}));

				nock('https://localhost')
					.get('/foo/bar')
					.reply(404, {
						message: 'Not found'
					});

				await assert.rejects(() => ms.call('good', 'good', 'good'), {
					name: 'MicroServiceCallError',
					code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
					statusCode: 404
				});
			});

			it('Should use response body `message` prop as error message if present', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://localhost/foo/bar',
					httpMethod: 'get'
				}));

				nock('https://localhost')
					.get('/foo/bar')
					.reply(500, {
						message: 'Something failed'
					});

				await assert.rejects(() => ms.call('good', 'good', 'good'),
					{
						name: 'MicroServiceCallError',
						code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
						message: 'Microservice failed (500): Something failed',
						statusCode: 500
					});
			});

			it('Should use response body stringified as error message if message prop is not present', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://localhost/foo/bar',
					httpMethod: 'get'
				}));

				nock('https://localhost')
					.get('/foo/bar')
					.reply(400, {
						foo: 'bar'
					});

				await assert.rejects(() => ms.call('good', 'good', 'good'),
					{
						name: 'MicroServiceCallError',
						code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
						message: 'Microservice failed (400): {"foo":"bar"}',
						statusCode: 400
					});
			});

			it('Should use a generic message as error message if response body is empty', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://localhost/foo/bar',
					httpMethod: 'get'
				}));

				nock('https://localhost')
					.get('/foo/bar')
					.reply(504);

				await assert.rejects(() => ms.call('good', 'good', 'good'),
					{
						name: 'MicroServiceCallError',
						code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
						message: 'Microservice failed (504): No response body',
						statusCode: 504
					});
			});

			it('Should return the lib error when the request library cannot make the call to the ms', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.replyWithError('Some lib error');

				await assert.rejects(ms.call('fake-entity', 'fake-entity', 'false'), {
					name: 'MicroServiceCallError',
					code: MicroServiceCallError.codes.REQUEST_LIB_ERROR,
					message: 'Some lib error'
				});
			});
		});

		context('When request not fails', () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			it('Should call the router fetcher without "httpMethod"', async () => {

				const getEndpointStub = sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({}));

				sinon.stub(MicroServiceCall.prototype, '_makeRequest').callsFake(() => ({
					headers: {},
					statusCode: 200,
					statusMessage: undefined,
					body: undefined
				}));

				await ms.call('service', 'namespace', 'method', {}, {});

				assert(getEndpointStub.calledWithExactly('service', 'namespace', 'method'));
			});

			it('Should return the correct response object on successful calls', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				const mockMsResponse = [{ name: 'foo' }];

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.call('sample-service', 'sample-entity', 'list');

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should send the correct values and return the correct values from ms', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'POST'
				}));

				const mockMsResponse = { id: 'foo-id' };

				nock('https://sample-service.janis-test.in')
					.post('/api/sample-entity', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.call('sample-service', 'sample-entity', 'create', { foo: 'bar' });

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should make the request with the correct path params', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state/{alarmState}',
					httpMethod: 'POST'
				}));

				const mockMsResponse = { name: 'foo' };

				nock('https://sample-service.janis-test.in')
					.post('/api/alarms/foo/state/ok', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.call('sample-service', 'alarms', 'post', { foo: 'bar' }, null, { alarmName: 'foo', alarmState: 'ok' });

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should make the request with the service name and secret from env variables if constructor arguments are empty', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'POST'
				}));


				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.post('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.call('sample-service', 'alarms', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });
			});

			it('Should make the request without the janis-client and x-janis-user if an empty session is present', async () => {

				ms.session = {};

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'PUT'
				}));


				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.put('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.call('sample-service', 'alarms', 'update', { foo: 'bar' }, null, { alarmName: 'foo' });
			});

			it('Should make the request with the janis-client and x-janis-user if session is present', async () => {

				ms.session = {
					clientCode: 'fizzmod',
					userId: 'dummy-user-id'
				};

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'PATCH'
				}));


				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret',
					'janis-client': 'fizzmod',
					'x-janis-user': 'dummy-user-id'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.patch('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.call('sample-service', 'alarms', 'patch', { foo: 'bar' }, null, { alarmName: 'foo' });
			});
		});
	});

	describe('SafeCall', () => {

		context('When request fails', () => {

			it('Should return a RouterFetcherError when no Settings', async () => {
				await assert.rejects(() => ms.safeCall('any', 'any', 'any'), { name: 'RouterFetcherError' });
			});

			it('Should not return an Error when the called microservice returns an statusCode 400+', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.reply(404, {
						message: 'Item not found'
					});

				const data = await ms.safeCall('sample-service', 'sample-entity', 'get', null, null, { id: 'claim-id-1' });

				assert.deepStrictEqual(data, {
					statusCode: 404,
					statusMessage: null,
					body: {
						message: 'Item not found'
					},
					headers: {
						'content-type': 'application/json'
					}
				});
			});

			it('Should not return an error when services response statusCode 500+ with no body', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.reply(504);

				const data = await ms.safeCall('sample-service', 'sample-entity', 'good');

				assert.deepStrictEqual(data, {
					statusCode: 504,
					statusMessage: null,
					body: undefined,
					headers: {}
				});
			});

			it('Should return the lib error when the request library cannot make the call to the ms', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.replyWithError('Some lib error');

				await assert.rejects(ms.safeCall('fake-entity', 'fake-entity', 'false'), {
					name: 'MicroServiceCallError',
					code: MicroServiceCallError.codes.REQUEST_LIB_ERROR,
					message: 'Some lib error'
				});
			});
		});

		context('When request not fails', () => {

			const headersResponse = {
				'content-type': 'application/json'
			};

			it('Should call the router fetcher without "httpMethod"', async () => {

				const getEndpointStub = sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({}));

				sinon.stub(MicroServiceCall.prototype, '_makeRequest').callsFake(() => ({
					headers: {},
					statusCode: 200,
					statusMessage: undefined,
					body: undefined
				}));

				await ms.safeCall('service', 'namespace', 'method', {}, {});

				assert(getEndpointStub.calledWithExactly('service', 'namespace', 'method'));
			});

			it('Should return the correct response object on successful calls', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'get'
				}));

				const mockMsResponse = [{ name: 'foo' }];

				nock('https://sample-service.janis-test.in')
					.get('/api/sample-entity')
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.safeCall('sample-service', 'sample-entity', 'list');

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should send the correct values and return the correct values from ms', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
					httpMethod: 'POST'
				}));

				const mockMsResponse = { id: 'foo-id' };

				nock('https://sample-service.janis-test.in')
					.post('/api/sample-entity', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.safeCall('sample-service', 'sample-entity', 'create', { foo: 'bar' });

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should make the request with the correct path params', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state/{alarmState}',
					httpMethod: 'POST'
				}));

				const mockMsResponse = { name: 'foo' };

				nock('https://sample-service.janis-test.in')
					.post('/api/alarms/foo/state/ok', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				const data = await ms.safeCall('sample-service', 'alarms', 'post', { foo: 'bar' }, null, { alarmName: 'foo', alarmState: 'ok' });

				assert.deepStrictEqual(data, {
					statusCode: 200,
					statusMessage: null,
					body: mockMsResponse,
					headers: headersResponse
				});
			});

			it('Should make the request with the service name and secret from env variables if constructor arguments are empty', async () => {

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'POST'
				}));

				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.post('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.safeCall('sample-service', 'alarms', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });
			});

			it('Should make the request without the janis-client and x-janis-user if an empty session is present', async () => {

				ms.session = {};

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'PUT'
				}));


				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.put('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.safeCall('sample-service', 'alarms', 'update', { foo: 'bar' }, null, { alarmName: 'foo' });
			});

			it('Should make the request with the janis-client and x-janis-user if session is present', async () => {

				ms.session = {
					clientCode: 'fizzmod',
					userId: 'dummy-user-id'
				};

				sinon.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
					endpoint: 'https://sample-service.janis-test.in/api/alarms/{alarmName}/state',
					httpMethod: 'PATCH'
				}));


				const mockMsResponse = { name: 'foo' };

				const reqheaders = {
					'content-type': 'application/json',
					'janis-api-key': 'service-dummy-service',
					'janis-api-secret': 'dummy-secret',
					'janis-client': 'fizzmod',
					'x-janis-user': 'dummy-user-id'
				};

				nock('https://sample-service.janis-test.in', { reqheaders })
					.patch('/api/alarms/foo/state', { foo: 'bar' })
					.reply(200, mockMsResponse, headersResponse);

				await ms.safeCall('sample-service', 'alarms', 'patch', { foo: 'bar' }, null, { alarmName: 'foo' });
			});
		});
	});

	describe('List', () => {

		it('Should passed the correct params and headers', async () => {

			sinon.stub(MicroServiceCall.prototype, 'call')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.list('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should passed the correct params and headers with filters', async () => {

			sinon.stub(MicroServiceCall.prototype, 'call')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.list('sample-service', 'sample-entity', { filters: { status: 'active' } });

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				{ filters: { status: 'active' } },
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should passed the correct params and headers with endpointParamaters', async () => {

			sinon.stub(MicroServiceCall.prototype, 'call')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.list('sample-service', 'sample-entity', null, { id: 'some-id' });

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				{ id: 'some-id' }
			);
		});

		it('Should make several calls to get full list of objects', async () => {

			const msCallStub = sinon.stub(MicroServiceCall.prototype, 'call');

			msCallStub.onCall(0).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-1' }]
			});

			msCallStub.onCall(1).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-2' }]
			});

			msCallStub.onCall(2).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-3' }]
			});

			const data = await ms.list('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 3
				},
				body: [
					{ name: 'item-1' },
					{ name: 'item-2' },
					{ name: 'item-3' }
				]
			});

			sinon.assert.calledThrice(MicroServiceCall.prototype.call);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 2 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 3 },
				undefined
			);
		});

		it('Should return a MicroServiceError if Services response statusCode 400+', async () => {

			sinon.stub(MicroServiceCall.prototype, 'call')
				.rejects(new MicroServiceCallError(
					'Microservice failed (500): Service Fails',
					MicroServiceCallError.codes.MICROSERVICE_FAILED,
					500
				));

			await assert.rejects(ms.list('sample-service', 'sample-entity'), {
				name: 'MicroServiceCallError',
				code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
				statusCode: 500
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should return a MicroServiceError if Services response statusCode 400+ after several calls', async () => {

			const msCallStub = sinon.stub(MicroServiceCall.prototype, 'call');

			msCallStub.onCall(0).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-1' }]
			});

			msCallStub.onCall(1).rejects(new MicroServiceCallError(
				'Microservice failed (500): Service Fails',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				500
			));

			await assert.rejects(ms.list('sample-service', 'sample-entity'), {
				name: 'MicroServiceCallError',
				code: MicroServiceCallError.codes.MICROSERVICE_FAILED,
				statusCode: 500
			});

			sinon.assert.calledTwice(MicroServiceCall.prototype.call);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.call,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 2 },
				undefined
			);
		});
	});

	describe('SafeList', () => {

		it('Should passed the correct params and headers', async () => {

			sinon.stub(MicroServiceCall.prototype, 'safeCall')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.safeList('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should passed the correct params and headers with filters', async () => {

			sinon.stub(MicroServiceCall.prototype, 'safeCall')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.safeList('sample-service', 'sample-entity', { filters: { status: 'active' } });

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				{ filters: { status: 'active' } },
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should passed the correct params and headers with endpoint-parameters', async () => {

			sinon.stub(MicroServiceCall.prototype, 'safeCall')
				.returns({
					statusCode: 200,
					headers: { 'x-janis-total': 0 },
					body: []
				});

			const data = await ms.safeList('sample-service', 'sample-entity', null, { id: 'some-id' });

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 0
				},
				body: []
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				{ id: 'some-id' }
			);
		});

		it('Should make several calls to get full list of objects', async () => {

			const msCallStub = sinon.stub(MicroServiceCall.prototype, 'safeCall');

			msCallStub.onCall(0).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-1' }]
			});

			msCallStub.onCall(1).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-2' }]
			});

			msCallStub.onCall(2).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-3' }]
			});

			const data = await ms.safeList('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 200,
				headers: {
					'x-janis-total': 3
				},
				body: [
					{ name: 'item-1' },
					{ name: 'item-2' },
					{ name: 'item-3' }
				]
			});

			sinon.assert.calledThrice(MicroServiceCall.prototype.safeCall);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 2 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 3 },
				undefined
			);
		});

		it('Should not rejects if Services response statusCode 400+', async () => {

			sinon.stub(MicroServiceCall.prototype, 'safeCall')
				.returns({
					statusCode: 500,
					headers: {},
					body: { message: 'Service Fails' }
				});

			const data = await ms.safeList('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 500,
				headers: {},
				body: { message: 'Service Fails' }
			});

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);
		});

		it('Should not rejects if Services response statusCode 400+ after several calls', async () => {

			const msCallStub = sinon.stub(MicroServiceCall.prototype, 'safeCall');

			msCallStub.onCall(0).returns({
				statusCode: 200,
				headers: { 'x-janis-total': 3 },
				body: [{ name: 'item-1' }]
			});

			msCallStub.onCall(1).returns({
				statusCode: 500,
				headers: {},
				body: { message: 'Service Fails' }
			});

			const data = await ms.safeList('sample-service', 'sample-entity');

			assert.deepEqual(data, {
				statusCode: 500,
				headers: {},
				body: { message: 'Service Fails' }
			});

			sinon.assert.calledTwice(MicroServiceCall.prototype.safeCall);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 1 },
				undefined
			);

			sinon.assert.calledWithExactly(MicroServiceCall.prototype.safeCall,
				'sample-service',
				'sample-entity',
				'list',
				null,
				{ 'x-janis-page': 2 },
				undefined
			);
		});
	});

	describe('Should Retry', () => {

		it('Should return true if no status code is found', () => {

			assert(ms.shouldRetry());
			assert(ms.shouldRetry({ body: [] }));
			assert(ms.shouldRetry(new Error('TypeError')));
			assert(ms.shouldRetry(new MicroServiceCallError('Request Lib Fails', MicroServiceCallError.codes.REQUEST_LIB_ERROR)));
		});

		it('Should return true if status code is 500 and not an exceptional one', () => {

			assert(ms.shouldRetry(new MicroServiceCallError(
				'Microservice failed (504): Timeout',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				504
			)));
			assert(ms.shouldRetry({
				statusCode: 504,
				body: { message: 'Timeout' }
			}));
			assert(ms.shouldRetry({
				statusCode: 500
			}));
		});

		it('Should return false if status code is 40X', () => {

			assert(!ms.shouldRetry(new MicroServiceCallError(
				'Microservice failed (404): Not Found',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				404
			)));
			assert(!ms.shouldRetry({
				statusCode: 404,
				body: { message: 'Not Found' }
			}));
			assert(!ms.shouldRetry({
				statusCode: 404
			}));
		});

		it('Should return false if status code is 500 and is an exceptional one', () => {

			assert(!ms.shouldRetry(new MicroServiceCallError(
				'Microservice failed (500): Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				500
			)));
			assert(!ms.shouldRetry({
				statusCode: 500,
				body: { message: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters' }
			}));

			assert(!ms.shouldRetry(new MicroServiceCallError(
				'Microservice failed (500): Invalid client',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				500
			)));
			assert(!ms.shouldRetry({
				statusCode: 500,
				body: { message: 'Invalid client' }
			}));
		});
	});

	describe('Cache endpoints', () => {

		it('Should cache the getEndpoint response after 2 times calling with same parameters', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').returns({
				endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
				httpMethod: 'POST'
			});

			const mockMsResponse = { id: 'foo-id' };

			const headersResponse = {
				'content-type': 'application/json'
			};

			nock('https://sample-service.janis-test.in')
				.post('/api/sample-entity', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data = await ms.call('sample-service', 'sample-entity', 'create', { foo: 'bar' });

			assert.deepStrictEqual(data, {
				statusCode: 200,
				statusMessage: null,
				body: mockMsResponse,
				headers: headersResponse
			});

			nock('https://sample-service.janis-test.in')
				.post('/api/sample-entity', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data2 = await ms.call('sample-service', 'sample-entity', 'create', { foo: 'bar' });

			assert.deepStrictEqual(data, data2);

			sinon.assert.calledOnceWithExactly(RouterFetcher.prototype.getEndpoint, 'sample-service', 'sample-entity', 'create');
		});

		it('Shouldn\'t cache the getEndpoint response after 2 times calling with different parameters', async () => {

			sinon.stub(RouterFetcher.prototype, 'getEndpoint').returns({
				endpoint: 'https://sample-service.janis-test.in/api/sample-entity',
				httpMethod: 'POST'
			});

			const mockMsResponse = { id: 'foo-id' };

			const headersResponse = {
				'content-type': 'application/json'
			};

			nock('https://sample-service.janis-test.in')
				.post('/api/sample-entity', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data = await ms.call('sample-service', 'sample-entity', 'create', { foo: 'bar' });

			assert.deepStrictEqual(data, {
				statusCode: 200,
				statusMessage: null,
				body: mockMsResponse,
				headers: headersResponse
			});

			nock('https://sample-service.janis-test.in')
				.post('/api/sample-entity', { foo: 'bar' })
				.reply(200, mockMsResponse, headersResponse);

			const data2 = await ms.call('sample-service', 'sample-entity', 'update', { foo: 'bar' });

			assert.deepStrictEqual(data, data2);

			sinon.assert.calledTwice(RouterFetcher.prototype.getEndpoint);
		});

	});
});
