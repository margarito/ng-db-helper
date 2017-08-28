import { QueryResult } from '../core/interfaces/query-result.interface';

/**
 * @private API
 * @class ModelResult is private part of the API.
 * A specific wrapper to convert QueryResult to typed QueryResult on demand
 *
 * @param T exdends {@link DbHelperModel}, a model declared with table and
 *          column annotations
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryResultWrapper implements QueryResult<any> {

    /**
     * @public
     * @property rowsAffected serve real ResultQuery rowsAffected;
     */
    public get rowsAffected(): number {
        return this.result.rowsAffected;
    }

    /**
     * @public
     * @property insertId serve real ResultQuery insertId;
     */
    public get insertId(): number | undefined {
        return this.result.insertId;
    }

    /**
     * @public
     * @property rows serve customized type ResultQuery rows;
     */
    public get rows() {
        return {
            /**
             * @public
             * @property rows.length serve real ResultQuery rows.length;
             */
            length: this.result.rows.length,

            /**
             * @public
             * @method item get typed item from ResultQuery and keep it in cache
             *              to avoid doing the job two times
             *
             * @param i the index of the item
             *
             * @return the typed item
             */
            item: (i: number): any => {
                return this.result.rows.item(i);
            },

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
     * @param result        {@link QueryResult<any>} the real QueryResult converted to return typed models
     * @param model         {@link DbHelperModel} the target model to convert
     * @param projection    the optional projection
     */
    public constructor(private result: any) {}

}
