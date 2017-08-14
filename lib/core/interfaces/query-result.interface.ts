/**
 * @interface QueryResult is an interface to standardize query result
 * In many case this could be any, but this allow to return typed object
 * on Select queries.
 * 
 * @param T the result type of the query.
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export interface QueryResult<T> {
    /**
     * @property rowsAffected, number of rows modified by the query
     */
    rowsAffected: number;

    /**
     * @property insertId, rowid of the last inserted model
     */
    insertId?: number;
    rows: {
        /**
         * @property length, number of rows of the query result
         */
        length: number;

        /**
         * @method item item getter of the row
         * 
         * @param i, the index row, index must verify 0 <= i < length 
         * 
         * @return T, the model returned by query
         */
        item(i: number): T;
    };
}
