/**
 * @class QueryError is thrown when a query fails
 *
 * @see Error
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryError implements Error {
    /**
     * @public
     * @property {string} name error name
     */
    public name: string;

    /**
     * @public
     * @property {any} stack error stack trace
     */
    public stack: any;
    /**
     * @public
     * @constructor
     * @param {string} message   message explaining in details error
     * @param {string} query     query text that did failed execution
     * @param {string} params    query params of the failed query
     */
    public constructor(public message: string, private query: string, private params: string) {
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.name = 'query error';
    }

    /**
     * @public
     * @method toString convert error to string
     *
     * @return {string} string represation of the error
     */
    public toString(): string {
        return name + '\n' + this.message + (this.query ? '\nquery: ' + this.query : '') + (this.params ? '\nparams: ' + this.params : '');
    }
}
