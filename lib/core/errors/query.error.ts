/**
 * @class QueryError is thrown when a query fails
 *
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryError implements Error {
    public name: string;
    public extra: any;
    public stack: any;
    /**
     * @public
     * @constructor
     * @param message   message explaining in details error
     * @param query     query text that did failed execution
     * @param params    query params of the failed query
     */
    public constructor(public message: string, private query: string, private params: string) {
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.name = 'query error';
    }
}
