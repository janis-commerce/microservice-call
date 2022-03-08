'use strict';

const sinon = require('sinon');
const assert = require('assert');

const axios = require('axios').default;

const Settings = require('@janiscommerce/settings');

const { Invoker } = require('@janiscommerce/lambda');

const MsCall = require('../lib/ms-call');
const EndpointFetcher = require('../lib/endpoint-fetcher');
const MsCallError = require('../lib/ms-call-error');
const MicroServiceCallError = require('../lib/ms-call-error');

describe.only('MsCall', () => {

	const defaultListPageSize = 1000;

	const headerPageSize = 'x-janis-page-size';
	const headerPage = 'x-janis-page';
	const headerTotal = 'x-janis-total';

	const endpointGetResolves = (data, status = 200) => {
		sinon.stub(axios, 'request')
			.resolves({ data, status });
	};

	const endpointGetRejects = err => {
		sinon.stub(axios, 'request')
			.rejects(err);
	};

	const assertEndpointGet = requestData => {
		if(requestData)
			sinon.assert.calledOnceWithExactly(axios.request, requestData);
		else
			sinon.assert.calledOnce(axios.request);
	};


	afterEach(() => {
		sinon.restore();
		EndpointFetcher.cache = {};
	});

	describe('Using call()', () => {

		const lambdaName = 'ProductPublish';

		beforeEach(() => {

			endpointGetResolves({
				path: '/product',
				method: 'POST',
				lambdaName
			});

			sinon.stub(Settings, 'get')
				.returns('https://janis.im/');
		});

		it('Should invoke lambda function passing the correct event', async () => {

			const apiResponse = { statusCode: 200 };

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.call('catalog', 'product', 'publish', {
				name: 'coke'
			}, {
				someHeader: 123
			});

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnceWithExactly(Invoker.apiCall, 'catalog', lambdaName, {
				requestPath: '/product',
				path: {},
				method: 'POST',
				body: { name: 'coke' },
				headers: { someHeader: 123 }
			});

			assertEndpointGet({
				url: 'https://janis.im/api/endpoint',
				params: {
					service: 'catalog',
					namespace: 'product',
					method: 'publish'
				},
				headers: { 'content-type': 'application/json' },
				validateStatus: sinon.match.func
			});
		});

		it('Should invoke lambda function using session', async () => {

			const apiResponse = { statusCode: 200 };

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const sessionData = { clientCode: 'fizzmod' };

			msCall.session = sessionData;

			const response = await msCall.call('catalog', 'product', 'publish', {
				name: 'coke'
			}, {
				someHeader: 123
			});

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnceWithExactly(Invoker.apiCall, 'catalog', lambdaName, {
				requestPath: '/product',
				path: {},
				method: 'POST',
				body: { name: 'coke' },
				headers: { someHeader: 123 },
				authorizer: { janisAuth: sessionData }
			});

			assertEndpointGet();
		});

		it('Should reject when lambda responses with a 4xx statusCode', async () => {

			sinon.stub(Invoker, 'apiCall')
				.resolves({ statusCode: 400, body: { message: 'missing name field for publish a product' } });

			const msCall = new MsCall();

			await assert.rejects(msCall.call('catalog', 'product', 'publish'), {
				code: MsCallError.codes.MICROSERVICE_FAILED
			});

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();
		});

		it('Should reject when lambda responses with a 4xx statusCode without message', async () => {

			sinon.stub(Invoker, 'apiCall')
				.resolves({ statusCode: 400, body: {} });

			const msCall = new MsCall();

			await assert.rejects(msCall.call('catalog', 'product', 'publish'), {
				code: MsCallError.codes.MICROSERVICE_FAILED
			});

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();
		});

		it('Should reject when lambda responses with a 5xx statusCode', async () => {

			sinon.stub(Invoker, 'apiCall')
				.resolves({ statusCode: 500 });

			const msCall = new MsCall();

			await assert.rejects(msCall.call('catalog', 'product', 'publish'), {
				code: MsCallError.codes.MICROSERVICE_FAILED
			});

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();
		});

		it('Should get from cache the endpoint and avoid multiple request to Discovery service', async () => {

			sinon.stub(Invoker, 'apiCall')
				.resolves({ statusCode: 200 });

			const msCall = new MsCall();

			await msCall.call('catalog', 'product', 'publish', { name: 'product 1' });

			await Promise.all([
				msCall.call('catalog', 'product', 'publish', { name: 'product 2' }),
				msCall.call('catalog', 'product', 'publish', { name: 'product 3' }),
				msCall.call('catalog', 'product', 'publish', { name: 'product 4' }),
				msCall.call('catalog', 'product', 'publish', { name: 'product 5' })
			]);

			assertEndpointGet();
		});
	});

	describe('Using safeCall()', () => {

		beforeEach(() => {

			endpointGetResolves({
				path: '/product',
				method: 'POST',
				lambdaName: 'ProductPublish'
			});

			sinon.stub(Settings, 'get')
				.returns('https://janis.im/');
		});

		it('Should not reject when lambda responses with a 4xx statusCode', async () => {

			const apiResponse = { statusCode: 400, body: { message: 'missing name field for publish a product' } };

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.safeCall('catalog', 'product', 'publish');

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();

		});

		it('Should not reject when lambda responses with a 5xx statusCode', async () => {

			const apiResponse = { statusCode: 500, body: { message: 'internal server error' } };

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.safeCall('catalog', 'product', 'publish', {
				name: 'product A'
			});

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();

		});

	});

	describe('Using list()', () => {

		const lambdaName = 'ProductList';

		beforeEach(() => {

			endpointGetResolves({
				path: '/product',
				method: 'GET',
				lambdaName
			});

			sinon.stub(Settings, 'get')
				.returns('https://janis.im/');
		});

		it('Should invoke lambda a single time if the response is smaller than default page size', async () => {

			const apiResponse = {
				statusCode: 200,
				body: [{ name: 'coke' }],
				headers: { [headerTotal]: 1 }
			};

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.list('catalog', 'product');

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnceWithExactly(Invoker.apiCall, 'catalog', lambdaName, {
				requestPath: '/product',
				path: {},
				method: 'GET',
				headers: {
					[headerPage]: 1,
					[headerPageSize]: defaultListPageSize
				}
			});

			assertEndpointGet();
		});

		it('Should invoke lambda two times if the response is bigger than the page size', async () => {

			const apiResponseFirstCall = {
				statusCode: 200,
				body: [{ name: 'coke' }],
				headers: { [headerTotal]: 2 }
			};

			const apiResponseSecondCall = {
				statusCode: 200,
				body: [{ name: 'sprite' }],
				headers: { [headerTotal]: 2 }
			};

			sinon.stub(Invoker, 'apiCall')
				.onCall(0)
				.resolves(apiResponseFirstCall)
				.onCall(1)
				.resolves(apiResponseSecondCall);

			const msCall = new MsCall();

			const response = await msCall.list('catalog', 'product', {}, {}, 1);

			assert.deepStrictEqual(response, {
				...apiResponseFirstCall,
				body: [
					...apiResponseFirstCall.body,
					...apiResponseSecondCall.body
				]
			});

			sinon.assert.calledWith(Invoker.apiCall, 'catalog', lambdaName, {
				requestPath: '/product',
				path: {},
				method: 'GET',
				query: {},
				headers: {
					[headerPage]: 1,
					[headerPageSize]: 1
				}
			});

			sinon.assert.calledWith(Invoker.apiCall, 'catalog', lambdaName, {
				requestPath: '/product',
				path: {},
				method: 'GET',
				query: {},
				headers: {
					[headerPage]: 2,
					[headerPageSize]: 1
				}
			});

			assertEndpointGet();
		});

	});

	describe('Using safeList()', () => {

		beforeEach(() => {

			endpointGetResolves({
				path: '/product',
				method: 'GET',
				lambdaName: 'ProductList'
			});

			sinon.stub(Settings, 'get')
				.returns('https://janis.im/');
		});

		it('Should not reject when lambda responses with a 4xx statusCode', async () => {

			const apiResponse = {
				statusCode: 400,
				body: { message: 'invalid filter price' }
			};

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.safeList('catalog', 'product', {
				filters: { price: 100 }
			});

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();

		});

		it('Should not reject when lambda responses with a 5xx statusCode', async () => {

			const apiResponse = {
				statusCode: 500,
				body: { message: 'internal server error' }
			};

			sinon.stub(Invoker, 'apiCall')
				.resolves(apiResponse);

			const msCall = new MsCall();

			const response = await msCall.safeList('catalog', 'product');

			assert.deepStrictEqual(apiResponse, response);

			sinon.assert.calledOnce(Invoker.apiCall);

			assertEndpointGet();

		});

	});

	describe('Using shouldRetry()', () => {

		const msCall = new MsCall();

		it('Should return true if no statusCode was found in response', () => {
			assert(msCall.shouldRetry());
			assert(msCall.shouldRetry({ body: [] }));
			assert(msCall.shouldRetry(new Error('TypeError')));
			assert(msCall.shouldRetry(new MicroServiceCallError('Microservice fails', MsCall.errorCodes.MICROSERVICE_FAILED)));
		});

		it('Should return true if statusCode is 500 and not an exceptional one', () => {

			assert(msCall.shouldRetry(new MicroServiceCallError(
				'Microservice failed (504): Timeout',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				504
			)));

			assert(msCall.shouldRetry({
				statusCode: 504,
				body: { message: 'Timeout' }

			}));
			assert(msCall.shouldRetry({
				statusCode: 500
			}));
		});

		it('Should return false if statusCode is 4xx', () => {

			assert(!msCall.shouldRetry(new MicroServiceCallError(
				'Microservice failed (404): Not Found',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				404
			)));

			assert(!msCall.shouldRetry({
				statusCode: 404,
				body: { message: 'Not Found' }
			}));

			assert(!msCall.shouldRetry({
				statusCode: 404
			}));
		});

		it('Should return false if statusCode is 500 and is an exceptional one', () => {

			assert(!msCall.shouldRetry(new MicroServiceCallError(
				'Microservice failed (500): Argument passed in must be a single String of 12 bytes or a string of 24 hex characters',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				500
			)));
			assert(!msCall.shouldRetry({
				statusCode: 500,
				body: { message: 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters' }
			}));

			assert(!msCall.shouldRetry(new MicroServiceCallError(
				'Microservice failed (500): Invalid client',
				MicroServiceCallError.codes.MICROSERVICE_FAILED,
				500
			)));
			assert(!msCall.shouldRetry({
				statusCode: 500,
				body: { message: 'Invalid client' }
			}));
		});

	});
});
