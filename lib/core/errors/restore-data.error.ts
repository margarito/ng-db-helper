/**
 * @class QueryError is thrown when a query fails
 *
 * @see Error
 * @author  Olivier Margarit
 * @since   0.1
 */
export class RestoreDataError implements Error {
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
    public constructor(public message: string) {
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.message = message;
        this.name = 'Restore data error';
    }

    public toString(): string {
        return name + '\n' + this.message;
    }
}
