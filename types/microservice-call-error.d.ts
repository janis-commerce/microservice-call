export = MicroServiceCallError;
declare class MicroServiceCallError extends Error {
    static get codes(): {
        MICROSERVICE_FAILED: number;
        REQUEST_LIB_ERROR: number;
        JANIS_SECRET_MISSING: number;
    };
    constructor(err: any, code: any, statusCode: any);
    code: any;
    statusCode: any;
    previousError: Error;
}
