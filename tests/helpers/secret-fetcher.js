'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');
const SecretFetcher = require('../../lib/secret-fetcher');

const SecretHandler = class SecretHandler {
	getValue() {}
};

const cleanSecretCache = () => {
	SecretFetcher.secretValue = undefined;
};

const secretGetValueResolves = value => {
	SecretHandler.prototype.getValue
		.resolves(value);
};

const stubGetSecret = (sandbox, value) => {

	cleanSecretCache();

	sandbox.stub(AwsSecretsManager, 'secret')
		.returns(new SecretHandler());

	sandbox.stub(SecretHandler.prototype, 'getValue');

	secretGetValueResolves(value || {});
};

const secretThrows = () => {

	cleanSecretCache();

	AwsSecretsManager.secret
		.throws(new Error('some secret error'));
};

const secretGetValueRejects = () => {

	cleanSecretCache();

	AwsSecretsManager.secret
		.returns(new SecretHandler());

	SecretHandler.prototype.getValue
		.rejects(new Error('some getValue error'));
};

const assertSecretsGet = (sandbox, secretName) => {
	sandbox.assert.calledOnceWithExactly(AwsSecretsManager.secret, secretName);
	sandbox.assert.calledOnceWithExactly(SecretHandler.prototype.getValue);
};

const secretsNotCalled = sandbox => {
	sandbox.assert.notCalled(AwsSecretsManager.secret);
	sandbox.assert.notCalled(SecretHandler.prototype.getValue);
};

const setJanisSecret = secret => {
	if(secret)
		process.env.JANIS_SERVICE_SECRET = secret;
	else
		delete process.env.JANIS_SERVICE_SECRET;
};

module.exports = {
	stubGetSecret,
	secretThrows,
	secretGetValueResolves,
	secretGetValueRejects,
	assertSecretsGet,
	secretsNotCalled,
	setJanisSecret
};
