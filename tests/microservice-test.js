'use strict';

const nock = require('nock');
const sinon = require('sinon');
const assert = require('assert');
const RouterFetcher = require('@janiscommerce/router-fetcher');
const Settings = require('@janiscommerce/settings');

const sandbox = sinon.createSandbox();

const MicroServiceCall = require('./../index.js');
const { MicroServiceCallError } = require('./../lib');

describe('Microservice call module.', () => {

	const validRouter = {
		endpoint: 'http://valid-router:3014/api/endpoint',
		schema: 'http://valid-router:3014/api/services/{serviceName}/schema'
	};

	const validApiKey = 'eFadkj840sdfjkesl';

	let ms;
	let settingsStub;

	beforeEach(() => {
		ms = new MicroServiceCall();
		settingsStub = sandbox.stub(Settings, 'get');
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should return api-key from Settings', () => {

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		assert.strictEqual(ms.apiKey, validApiKey);

		sandbox.assert.calledOnce(Settings.get);
		sandbox.assert.calledWithExactly(Settings.get.getCall(0), MicroServiceCall.apiKeyField);
	});

	it('should return apiKey from Settings but in a second call should use cache', () => {
		settingsStub.withArgs(MicroServiceCall.apiKeyField).returns(validApiKey);

		assert.strictEqual(ms.apiKey, validApiKey);
		assert.strictEqual(ms.apiKey, validApiKey);

		sandbox.assert.calledOnce(Settings.get);
		sandbox.assert.calledWithExactly(Settings.get.getCall(0), MicroServiceCall.apiKeyField);

	});

	it('should throw Error when Settings for apiKey not exist', () => {
		settingsStub.withArgs(MicroServiceCall.apiKeyField).returns();

		assert.throws(() => ms.apiKey, { name: 'MicroServiceCallError', code: MicroServiceCallError.codes.INVALID_API_KEY_SETTING });
		sandbox.assert.calledOnce(Settings.get);
		sandbox.assert.calledWithExactly(Settings.get.getCall(0), MicroServiceCall.apiKeyField);

	});

	it('should return RouterFetcherError when no Settings', async () => {

		settingsStub.returns();

		await assert.rejects(() => ms.get('any', 'any', 'any'),
			{ name: 'RouterFetcherError' });
	});

	it('should return the correct response.', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const headersResponse = {
			'content-type': 'application/json'
		};

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
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

	it('should send the correct values and return the correct values from ms too.', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const headersResponse = {
			'content-type': 'application/json'
		};

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
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

	it('should return an "MicroServiceCallError" when the microservice called return an error.', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
			endpoint: 'https://localhost/foo/bar',
			httpMethod: 'get'
		}));

		nock('https://localhost')
			.get('/foo/bar')
			.reply(404, {
				message: 'some failed.'
			});

		await assert.rejects(() => ms.get('good', 'good', 'good'),
			{ name: 'MicroServiceCallError', code: MicroServiceCallError.codes.MICROSERVICE_FAILED });
	});

	it('should make the request with the correct params.', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const headersResponse = {
			'content-type': 'application/json'
		};

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
			endpoint: 'http://localhost/api/alarms/{alarmName}/state',
			httpMethod: 'POST'
		}));


		const mockMsResponse = { name: 'foo' };

		nock('http://localhost/api/alarms/foo/state')
			.post('', { foo: 'bar' })
			.reply(200, mockMsResponse, headersResponse);

		const data = await ms.post('sac', 'claim-type', 'list', { foo: 'bar' }, null, { alarmName: 'foo' });

		assert.deepStrictEqual(data, {
			statusCode: 200,
			statusMessage: null,
			body: mockMsResponse,
			headers: headersResponse
		});
	});

	it('should return an generic error when the request library cannot make the call to the ms.', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
			endpoint: 'endpointunreachable',
			httpMethod: 'POST'
		}));

		await assert.rejects(ms.post('false', 'false', 'false'), {
			name: 'MicroServiceCallError',
			code: MicroServiceCallError.codes.REQUEST_LIB_ERROR
		});

	});

	it('should call private `_call` on put method with correct params', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.put('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PUT', {}), '_call method not called properly.');
	});

	it('should call private `_call` on patch method with correct params', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.patch('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PATCH', {}), '_call method not called properly.');
	});

	it('should call private `_call` on delete method with correct params', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.delete('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'DELETE', {}), '_call method not called properly.');
	});

	it('should call private `_call` on get method with correct params', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.get('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'GET', {}), '_call method not called properly.');
	});

	it('should call private `_call` on post method with correct params', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const callStub = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.post('a', 'b', 'c', {}, {}, {});

		assert(callStub.calledWithExactly('a', 'b', 'c', {}, {}, 'POST', {}), '_call method not called properly.');
	});

	it('should call the router fetcher without "httpMethod"', async () => {

		settingsStub.withArgs(RouterFetcher.routerConfigField)
			.returns(validRouter);

		settingsStub.withArgs(MicroServiceCall.apiKeyField)
			.returns(validApiKey);

		const getEndpointStub = sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({}));

		sandbox.stub(MicroServiceCall.prototype, '_makeRequest').callsFake(() => null);

		await ms._call('service', 'namespace', 'method', {}, {});

		assert(getEndpointStub.calledWithExactly('service', 'namespace', 'method', null));
	});

});
