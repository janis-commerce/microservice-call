'use strict';

const { AwsSecretsManager } = require('@janiscommerce/aws-secrets-manager');

const MicroServiceCallError = require('./microservice-call-error');

module.exports = class SecretFetcher {

	static get secretName() {
		return process.env.JANIS_SERVICE_NAME;
	}

	static async fetch() {

		if(process.env.JANIS_SERVICE_SECRET)
			this.secretValue = process.env.JANIS_SERVICE_SECRET;

		if(!this.shouldFetchSecret())
			return;

		try {

			const secretHandler = AwsSecretsManager.secret(this.secretName);

			this.secretValue = await secretHandler.getValue();

			this.secretValue = this.secretValue && this.secretValue.apiSecret
				? this.secretValue.apiSecret
				: false;

		} catch(err) {
			this.secretValue = false;
			// nothing to do here...
		}

		if(this.secretValue === false)
			throw new MicroServiceCallError('Microservice failed: Secret is missing', MicroServiceCallError.codes.JANIS_SECRET_MISSING);
	}

	static shouldFetchSecret() {
		return typeof this.secretValue === 'undefined';
	}
};
