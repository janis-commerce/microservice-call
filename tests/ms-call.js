'use strict';

const sinon = require('sinon');
const assert = require('assert');

const axios = require('axios').default;

const Settings = require('@janiscommerce/settings');

const { Invoker } = require('@janiscommerce/lambda');

const MsCall = require('../lib/ms-call');
const EndpointFetcher = require('../lib/endpoint-fetcher');
const MsCallError = require('../lib/ms-call-error');

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
});
