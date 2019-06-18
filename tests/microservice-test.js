'use strict';

const nock = require('nock');
const sinon = require('sinon');
const assert = require('assert');
const mockRequire = require('mock-require');
const RouterFetcher = require('@janiscommerce/router-fetcher');

const sandbox = sinon.createSandbox();

const MicroServiceCall = require('./../index.js');
const { MicroServiceCallError } = require('./../lib');

/* eslint-disable prefer-arrow-callback */

describe('Microservice call module.', () => {

	const validRouter = {
		endpoint: 'http://valid-router:3014/api/endpoint',
		schema: 'http://valid-router:3014/api/services/{serviceName}/schema'
	};

	const mockRouterFetcherPaths = (apiKey, routerConfig) => {
		/* eslint-disable global-require, import/no-dynamic-require */
		mockRequire(RouterFetcher.apiKeyPath, apiKey);
		mockRequire(RouterFetcher.routerConfigPath, routerConfig);

	};

	const mockMicroServiceCallPaths = apiKey => {
		/* eslint-disable global-require, import/no-dynamic-require */
		mockRequire(MicroServiceCall.apiKeyPath, apiKey);
	};

	afterEach(() => {
		sandbox.restore();
		mockRequire.stopAll();
	});

	const ms = new MicroServiceCall();

	it('should return RouterFetcherError', async() => {
		await assert.rejects(() => ms.get('any', 'any', 'any'),
			{ name: 'RouterFetcherError' });
	});

	it('should return the correct response.', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

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

	it('should send the correct values and return the correct values from ms too.', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

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

	it('should return an "MicroServiceCallError" when the microservice called return an error.', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

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

	it('should make the request with the correct params.', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

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

	it('should return an generic error when the request library cannot make the call to the ms.', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({
			endpoint: 'endpointunreachable',
			httpMethod: 'POST'
		}));

		await assert.rejects(() => ms.post('false', 'false', 'false'), {
			name: 'MicroServiceCallError',
			code: MicroServiceCallError.codes.REQUEST_LIB_ERROR
		});

	});

	it('should call private `_call` on put method with correct params', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.put('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PUT', {}), '_call method not called properly.');
	});

	it('should call private `_call` on patch method with correct params', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.patch('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'PATCH', {}), '_call method not called properly.');
	});

	it('should call private `_call` on delete method with correct params', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.delete('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'DELETE', {}), '_call method not called properly.');
	});

	it('should call private `_call` on get method with correct params', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const spy = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.get('a', 'b', 'c', {}, {}, {});

		assert(spy.calledWithExactly('a', 'b', 'c', {}, {}, 'GET', {}), '_call method not called properly.');
	});

	it('should call private `_call` on post method with correct params', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const callStub = sandbox.stub(MicroServiceCall.prototype, '_call').callsFake(() => null);

		await ms.post('a', 'b', 'c', {}, {}, {});

		assert(callStub.calledWithExactly('a', 'b', 'c', {}, {}, 'POST', {}), '_call method not called properly.');
	});

	it('should call the router fetcher without "httpMethod"', async() => {
		mockRouterFetcherPaths({}, validRouter);
		mockMicroServiceCallPaths({});

		const getEndpointStub = sandbox.stub(RouterFetcher.prototype, 'getEndpoint').callsFake(() => ({}));

		sandbox.stub(MicroServiceCall.prototype, '_makeRequest').callsFake(() => null);

		await ms._call('service', 'namespace', 'method', {}, {});

		assert(getEndpointStub.calledWithExactly('service', 'namespace', 'method', null));
	});

});
