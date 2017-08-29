import { DbHelperModel } from '../db-helper-model.model';
import { ModelManager } from '../../managers/model-manager';
import { QueryResult } from '../../interfaces/query-result.interface';

/**
 * @private
 * @class ModelResult
 *
 * @description
 * This class is private part of the API.
 * A specific wrapper to convert QueryResult to typed QueryResult on demand
 *
 * @param T @extends {@link DbHelperModel}, a model declared with table and
 *          column annotations
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class ModelResult<T extends DbHelperModel> implements QueryResult<T> {
    /**
     * @private
     * @property {Array<T>} cache array of converted model. Only keep getted model as cache
     */
    private cache: T[];

    /**
     * @public
     * @property {number} rowsAffected serve real ResultQuery rowsAffected;
     */
    public get rowsAffected(): number {
        return this.result.rowsAffected;
    }

    /**
     * @public
     * @property {number} insertId serve real ResultQuery insertId;
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
             * @return {T} the typed item
             */
            item: (i: number): T => {
                if (!this.cache[i]) {
                    const entity = new this.model();
                    const item = this.result.rows.item(i);
                    for (const key in entity.$$shadow) {
                        if (entity.$$shadow.hasOwnProperty(key)) {
                            const shadow = entity.$$shadow[key];
                            if (this.projection && this.projection.indexOf(key) < 0) {
                                continue;
                            }
                            if (item.hasOwnProperty(key)) {
                                shadow.val = item[key];
                            }
                        }
                    }
                    entity.$$partialWithProjection = this.projection;
                    entity.$$rowid = item.hasOwnProperty('rowid') ? item.rowid : null;
                    entity.$$inserted = true;
                    entity.$$isModified = false;
                    this.cache[i] = entity;
                }
                return this.cache[i];
            },

            /**
             * @public
             * @method toArray convert rows to an array of instanciated models
             *
             * @return {Array<T>} the array of models
             */
            toArray: (): T[] => {
                for (let i = 0; i < this.cache.length; i++) {
                    if (!this.cache[i]) {
                        this.rows.item(i);
                    }
                }
                return this.cache;
            }
        };
    };

    /**
     * @public
     * @constructor this is a private API and should not be available for integrators
     *
     * @param {QueryResult<any>} result     the real QueryResult converted to return typed models
     * @param {{new(): T}} model         the target model to convert
     * @param {Array<string>} projection    the optional projection
     */
    public constructor(private result: QueryResult<any>, private model: {new(): T}, private projection?: string[]) {
        this.cache = new Array(result.rows.length).fill(null);
    }

}
