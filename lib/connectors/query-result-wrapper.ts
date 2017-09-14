import { QueryResult } from 'ts-db-helper';

/**
 * @private
 * @class ModelResult @implements {QueryResult<any>}
 *
 * @description
 * This class is private part of the API.
 * A specific wrapper to convert QueryResult to typed QueryResult on demand
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryResultWrapper implements QueryResult<any> {

    /**
     * @public
     * @property {number} rowsAffected serve real ResultQuery rowsAffected;
     */
    public get rowsAffected(): number {
        return this.result.rowsAffected;
    }

    /**
     * @public
     * @property {number|undefined} insertId serve real ResultQuery insertId;
     */
    public get insertId(): number | undefined {
        return this.result.insertId;
    }

    /**
     * @public
     * @property {Object} rows serve customized type ResultQuery rows;
     */
    public get rows() {
        return {
            /**
             * @public
             * @property {number} length serve real ResultQuery rows.length;
             */
            length: this.result.rows.length,

            /**
             * @public
             * @method item get typed item from ResultQuery and keep it in cache
             *              to avoid doing the job two times
             *
             * @param {number} i the index of the item
             *
             * @return {any} the result item
             */
            item: (i: number): any => {
                return this.result.rows.item(i);
            },

            /**
             * @public
             * @method toArray
             *
             * @return {Array<any>} convert results to array
             */
            toArray: (): any[] => {
                const results = <any[]>[];
                for (let i = 0; i < this.result.rows.length; i++) {
                    results.push(this.result.rows.item(i));
                }
                return results;
            }
        };
    };

    /**
     * @public
     * @constructor this is a private API and should not be available for integrators
     *
     * @param {any} result  the real QueryResult converted to return typed models
     */
    public constructor(private result: any) {}

}
