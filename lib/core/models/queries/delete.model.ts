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

/**
 * @private API
 * @class QueryDelete is private part of the API.
 * For design reasons this class should not be used directly and
 * will move later. Use this class through {@link Delete} function.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table
 *          and column annotations
 * 
 * @example
 * // Delete a specific model using Delete
 * // assume that "todo" is declared before and is a model extending
 * // DbHelperModel and using Table + Column annotation
 * Delete(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // the model is deleted...
 * }, (err) => {
 *      // manage th error...
 * });
 * // You could use Delete statement to delete many entries
 * Delete(Todo).where({isDone: true}).exec().subscribe((qr: QueryResult<any>) => {
 *      // all done todos are deleted !
 * }, (err) => {
 *      // manage th error...
 * });
 * 
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryDelete<T extends DbHelperModel> {
    /**
     * @private
     * @property type the type of statement, should not be modified
     */
    private type = 'DELETE';

    /**
     * @private
     * @property whereClauses is {@link ClauseGroup} instance containing
     * where clauses
     */
    private whereClauses: ClauseGroup;

    /**
     * @public
     * @constructor should not be use directly, see class header
     * 
     * @param model DbHelperModel extention
     */
    public constructor(private model: T | {new(): T }) {}

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup}
     * 
     * @param clauses  ClauseGroup, Clause, Clause list of dictionnary of clauses
     * 
     * @return this instance to chain query instructions
     */
    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryDelete<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     * 
     * @return {@link DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        const table = ModelManager.getInstance().getModel(this.model);
        const dbQuery = new DbQuery();
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        dbQuery.query += this.type;
        dbQuery.query += ' FROM ' + table.name;
        if (this.model.hasOwnProperty('__class')) {
            for (const column of table.columnList) {
                if (column.primaryKey) {
                    const clause = new Clause();
                    clause.key = column.name;
                    clause.value = (this.model as {[index:string]: any})[column.field];
                    this.where(clause);
                }
            }
        }
        if (this.whereClauses) {
            dbQuery.query += ' WHERE';
            dbQuery.append(this.whereClauses.build());
        }
        return dbQuery;
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     * 
     * @return observable to subscribe
     */
    public exec(): Observable<QueryResult<any>> {
        return QueryManager.getInstance().query(this.build());
    }
}

/**
 * @public API
 * @function Delete allow to simply remove model instance or entries
 * matching with specific clauses.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table
 *          and column annotations
 * 
 * @example
 * // Delete a specific model using Delete
 * // assume that "todo" is declared before and is a model extending
 * // DbHelperModel and using Table + Column annotation
 * Delete(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // the model is deleted...
 * }, (err) => {
 *      // manage th error...
 * });
 * // You could use Delete statement to delete many entries
 * Delete(Todo).where({isDone: true}).exec().subscribe((qr: QueryResult<any>) => {
 *      // all done todos are deleted !
 * }, (err) => {
 *      // manage th error...
 * });
 * 
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Delete<T extends DbHelperModel>(model: T | {new(): T }): QueryDelete<T> {
    return new QueryDelete(model);
}
