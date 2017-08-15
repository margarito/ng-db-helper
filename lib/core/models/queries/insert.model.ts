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

/**
 * @private API
 * @class QueryInsert is private part of the API.
 * For design reasons this class should not be used directly and
 * will move later. Use this class with {@link Insert} function.
 * Prefer use of save() method instead of Insert for a single entry.
 * Insert optimize multiple entry insertion with bulk mecanisme for example.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
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
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryInsert<T extends DbHelperModel> {
    /**
     * @private
     * @static
     * @property    SQLITE_PRAMS_LIMIT is a standard SQLite driver limit
     *              this parameter will probably be customizable in a futrue
     *              release
     */
    private static SQLITE_PRAMS_LIMIT = 999;

    /**
     * @private
     * @property type, statement type
     */
    private type = 'INSERT';

    /**
     * @public
     * @constructor should not be use directly, see class header
     * 
     * @param model {@link DbHelperModel} extention
     */
    public constructor(private model: T | T[]) {}


    /**
     * @public
     * @method build should be removed to be a part of the private API
     * 
     * @return {@link DbQuery} of the query with the string part and
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
                const value = (item as {[index:string]: any})[column.field];
                parameters.push(value === undefined ? null : value);
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
     * @return observable to subscribe
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
                observable = Observable.create((observer: Observer<QueryResult<any>>) => {
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

                    const subscription = Observable.combineLatest(observables).subscribe((qrs: QueryResult<any>[]) => {
                        let rowsAffected = 0;
                        let insertId: number | undefined;
                        for (const qr of qrs) {
                            rowsAffected += qr.rowsAffected;
                            if (qr && qr.insertId || qr.insertId === 0) {
                                insertId = Math.max(insertId ? insertId: 0, qr.insertId);
                            }
                        }
                        observer.next({
                            rowsAffected: rowsAffected,
                            insertId: insertId,
                            rows: {
                                length: 0,
                                item: function (i: number) {
                                    return null;
                                }
                            }
                        });
                    }, (err) => observer.error(err));
                });
            }
        }
        if (!observable) {
            // this is not a too big array, so the query can simply be executed
            observable = Observable.create((observer: Observer<QueryResult<any>>) => {
                QueryManager.getInstance().query(this.build()).subscribe((qr: QueryResult<any>) => {
                    if (Array.isArray(this.model)) {
                        for (const model of this.model) {
                            model.__inserted = true;
                        }
                    } else {
                        this.model.__inserted = true;
                    }
                    observer.next(qr);
                }, (err) => observer.error(err), () => observer.complete());
            });
        }
        return observable as Observable<QueryResult<any>>;
    }
}

/**
 * @public API
 * @function Insert provide an easy mean of data insertion.
 * Prefer use the save() method instead of Insert for a single entry, see
 * {@link DbHelperModel} for more informations.
 * Insert optimize multiple entry insertion with bulk mecanisme for example.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and
 *          column annotations
 * 
 * @example
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
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Insert<T extends DbHelperModel>(model: T | T[]): QueryInsert<T> {
    return new QueryInsert(model);
}
