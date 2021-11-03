export = SecretFetcher;
declare class SecretFetcher {
    /**
     * Get the secret name of Janis Service
     * @returns {string}
     */
    static get secretName(): string;
    /**
     * Get local secret value
     * @returns {string}
     */
    static get localSecretValue(): string;
    /**
     * Request the secret value to AwsSecretManager
     * @throws {MicroServiceCallError} If the secretValue is missing
     */
    static fetch(): Promise<void>;
    /**
     * Check if the secret value should be fetched
     * @returns {boolean}
     */
    static shouldFetchSecret(): boolean;
}
