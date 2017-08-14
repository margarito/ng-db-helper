/**
 * @class QueryError is thrown when a query fails
 * 
 * @see Error
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryError extends Error {
    /**
     * @public
     * @constructor
     * @param message   message explaining in details error 
     * @param query     query text that did failed execution 
     * @param params    query params of the failed query
     */
    public constructor(public message: string, private query: string, private params: string) {
        super();
        this.name = 'query error';
    }
}
