import { toArray } from 'rxjs/operator/toArray';
/**
 * @public
 * @interface QueryResult
 *
 * @description
 * This interface standardize query result
 * In many case this could be any, but this allow to return typed object
 * on Select queries.
 *
 * @param T the result type of the query.
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export interface QueryResult<T> {
    /**
     * @property {number} rowsAffected number of rows modified by the query
     */
    rowsAffected: number;

    /**
     * @property {number} insertId rowid of the last inserted model
     */
    insertId?: number;

    /**
     * @property {Object} rows rows accessor
     */
    rows: {
        /**
         * @property {number} length number of rows of the query result
         */
        length: number;

        /**
         * @method item item getter of the row
         *
         * @param {number} i the index row, index must verify 0 <= i < length
         *
         * @return {T} the model returned by query
         */
        item(i: number): T;

        /**
         * @method toArray convert the rows to an array of items
         *
         * @return {Array<T>} an array of templated object.
         *
         * @since 0.2
         */
        toArray(): T[];
    };
}
