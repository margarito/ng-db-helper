import { toArray } from 'rxjs/operator/toArray';
import { QueryError } from '../../errors/query.error';
import { DbHelperModel } from '../db-helper-model.model';
import { retryWhen } from 'rxjs/operator/retryWhen';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/map';

/**
 * @public
 * @class QueryInsert
 *
 * @description
 * For design reasons this class should not be used directly. Use this class with {@link Insert} function.
 * Prefer use of save() method instead of Insert for a single entry.
 * Insert optimize multiple entry insertion with bulk mecanisme for example.
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // Create new model instance
 * const todo = new Todo();
 * // manipulates todo instance and then insert it
 * Insert(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });
 *
 * // it is simplier to use the save methode for a single entry
 * todo.save()
 *
 * // Insertion should be used for multiple model insertion
 * const todos = <Todo[]>[];
 * // provide and edi.subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });t new entries
 * Insert(todos).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryInsert<T extends DbHelperModel> {
    /**
     * @private
     * @static
     * @constant {number} SQLITE_PRAMS_LIMIT is a standard SQLite driver limit
     *              this parameter will probably be customizable in a futrue
     *              release
     */
    private static readonly SQLITE_PRAMS_LIMIT = 999;

    /**
     * @private
     * @constant {string} type statement type
     */
    private readonly type = 'INSERT';

    /**
     * @public
     * @constructor should not be use directly, see class header
     *
     * @param {T | Array<T>} model  DbHelper model or list of models
     */
    public constructor(private model: T | T[]) {}


    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        let table;
        const dbQuery = new DbQuery();
        if (Array.isArray(this.model)) {
            if (this.model.length) {
                table = ModelManager.getInstance().getModel(this.model[0]);
            } else {
                return dbQuery;
            }
        } else {
            table = ModelManager.getInstance().getModel(this.model);
        }
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        const columns = [];

        for (const column of table.columnList) {
            columns.push(column.name);
        }
        dbQuery.query += this.type + ' INTO ' + table.name + ' (' + columns.join(', ') + ') VALUES ';

        const items = Array.isArray(this.model) ? this.model : [this.model];
        const valuesStrings = [];
        const parameters = [];
        for (const item of items) {
            const interrogationMarks = [];
            for (const column of table.columnList) {
                const value = item.getColumnValue(column.name);
                if (value === undefined) {
                    parameters.push(null);
                    item.setFieldValue(column.field, null);
                } else {
                    parameters.push(value);
                }
                interrogationMarks.push('?');
            }
            valuesStrings.push('(' + interrogationMarks.join(', ') + ')');
        }
        dbQuery.query += valuesStrings.join(', ');
        dbQuery.params = dbQuery.params.concat(parameters);
        return dbQuery;
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     *
     * @return {Observable<QueryResult<any>>} observable to subscribe and manage results
     */
    public exec(): Observable<QueryResult<any>> {
        let observable: Observable<QueryResult<any>> | null = null;
        if (Array.isArray(this.model)) {
            // check if array is to big for insertion
            let table;
            if (this.model.length) {
                table = ModelManager.getInstance().getModel(this.model[0]);
            } else {
                throw(new QueryError('Try to insert empty array', '', ''));
            }
            const maxItemNumberPerRequest = Math.floor(QueryInsert.SQLITE_PRAMS_LIMIT / table.columnList.length);
            const numberOfParts = Math.floor(this.model.length / maxItemNumberPerRequest) + 1;
            if (numberOfParts > 1) {
                // Array is to big, subsequent insert queries will be created and executed
                const observables = [];
                for (let i = 0; i < numberOfParts; i += 1) {
                    const start = i * maxItemNumberPerRequest;
                    const nextIndex = start + maxItemNumberPerRequest;
                    const end = nextIndex < (this.model as Array<T>).length ? nextIndex : (this.model as Array<T>).length;
                    if (start >= end) {
                        break;
                    }
                    const insert = Insert((this.model as Array<T>).slice(start, end));
                    observables.push(insert.exec());
                }

                observable = Observable.combineLatest(observables).map((qrs: QueryResult<any>[]) => {
                    let rowsAffected = 0;
                    let insertId: number | undefined;
                    for (const qr of qrs) {
                        rowsAffected += qr.rowsAffected;
                        if (qr && qr.insertId || qr.insertId === 0) {
                            insertId = Math.max(insertId ? insertId : 0, qr.insertId);
                        }
                    }
                    return {
                        rowsAffected: rowsAffected,
                        insertId: insertId,
                        rows: {
                            length: 0,
                            item: function (i: number) {
                                return null;
                            },
                            toArray: function (): any[] {
                                return <any[]>[];
                            }
                        }
                    };
                });
            }
        }
        if (!observable) {
            // this is not a too big array, so the query can simply be executed
            observable = QueryManager.getInstance().query(this.build());
            observable.map((qr: QueryResult<any>) => {
                if (Array.isArray(this.model)) {
                    for (const model of this.model) {
                        model.$$inserted = true;
                        model.$$isModified = false;
                    }
                } else {
                    this.model.$$inserted = true;
                    this.model.$$isModified = false;
                }
                return qr;
            });
        }
        return observable as Observable<QueryResult<any>>;
    }
}

/**
 * @public
 * @function Insert
 *
 * @description
 * This function provides an easy mean of data insertion.
 * Prefer use the save() method instead of Insert for a single entry, see
 * {@link DbHelperModel} for more informations.
 * Insert optimize multiple entry insertion with bulk mecanisme for example.
 *
 * @param T @extends DbHelperModel a model declared with table and
 *          column annotations
 *
 * @example
 * ```typescript
 * // Create new model instance
 * const todo = new Todo();
 * // manipulates todo instance and then insert it
 * Insert(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });
 *
 * // it is simplier to use the save methode for a single entry
 * todo.save()
 *
 * // Insertion should be used for multiple model insertion
 * const todos = <Todo[]>[];
 * // provide and edi.subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });t new entries
 * Insert(todos).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something after insertion
 * }, (err) => {
 *      // manage error
 * });
 * ```
 *
 * @return {QueryInsert<T>} QueryInsert instance
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function Insert<T extends DbHelperModel>(model: T | T[]): QueryInsert<T> {
    return new QueryInsert(model);
}
