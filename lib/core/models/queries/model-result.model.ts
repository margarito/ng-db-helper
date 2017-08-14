import { DbHelperModel } from '../db-helper-model.model';
import { ModelManager } from '../../managers/model-manager';
import { QueryResult } from '../../interfaces/query-result.interface';

/**
 * @private API
 * @class ModelResult is private part of the API.
 * A specific wrapper to convert QueryResult to typed QueryResult on demand
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and
 *          column annotations
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class ModelResult<T extends DbHelperModel> implements QueryResult<T> {
    /**
     * @private
     * @property cache, array of converted model. Only keep getted model as cache
     */
    private cache: T[];

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
            item: (i: number): T => {
                if (!this.cache[i]) {
                    const entity = new this.model();
                    const item = this.result.rows.item(i);
                    const table = ModelManager.getInstance().getModel(this.model);
                    for (const column of table.columnList) {
                        if (this.projection && this.projection.indexOf(column.name) < 0) {
                            continue;
                        }
                        if (item.hasOwnProperty(column.name)) {
                            (entity as {[index:string]:any})[column.field] = item[column.name];
                        }
                    }
                    entity.__partialWithProjection = this.projection;
                    entity.__rowid = item.hasOwnProperty('rowid') ? item.rowid : null;
                    entity.__inserted = true;
                    this.cache[i] = entity;
                }
                return this.cache[i];
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
    public constructor(private result: QueryResult<any>, private model: {new(): T }, private projection?: string[]) {
        this.cache = new Array(result.rows.length).fill(null);
    }

}
