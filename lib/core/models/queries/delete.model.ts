import { CompositeClause } from './composite-clause.model';
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
 * @public
 * @class QueryDelete
 *
 * @description
 * For design reasons this class should not be used directly. Use this class through {@link Delete} function.
 *
 * @param T @extends DbHelperModel a model declared with table
 *          and column annotations
 *
 * @example
 * ```typesrcript
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
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryDelete<T extends DbHelperModel> {
    /**
     * @private
     * @constant {string} type the type of statement, should not be modified
     */
    private readonly type = 'DELETE';

    /**
     * @private
     * @property {ClauseGroup} whereClauses is {@link ClauseGroup} instance containing
     * where clauses
     */
    private whereClauses: ClauseGroup;

    /**
     * @public
     * @constructor should not be use directly, see class header
     *
     * @param {T | {new(): T }} model DbHelperModel extention
     */
    public constructor(private model: T | {new(): T }) {}

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup}
     *
     * @param {Clause|Clause[]|ClauseGroup|CompositeClause|{[index: string]: any}} clauses list of clauses
     *
     * @return {QueryDelete<T>} this instance to chain query instructions
     */
    public where(clauses: Clause|Clause[]|ClauseGroup|CompositeClause|{[index: string]: any}): QueryDelete<T> {
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
     * @return {DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        const table = ModelManager.getInstance().getModel(this.model);
        const dbQuery = new DbQuery();
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        dbQuery.query += this.type;
        dbQuery.query += ' FROM ' + table.name;
        if ((this.model as {[index: string]: any}).$$isDbHelperModel) {
            for (const column of table.columnList) {
                if (column.primaryKey) {
                    const clause = new Clause();
                    clause.key = column.name;
                    clause.value = (this.model as {[index: string]: any})[column.field];
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
     * @return {Observable<QueryResult<any>>} observable to subscribe and retrieve results
     */
    public exec(): Observable<QueryResult<any>> {
        return QueryManager.getInstance().query(this.build());
    }
}

/**
 * @public API
 * @function Delete
 *
 * @description
 * this function allow to simply remove model instance or entries
 * matching with specific clauses.
 *
 * @param T @extends DbHelperModel a model declared with table
 *          and column annotations
 *
 * @example
 * ```typescript
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
 * ```
 *
 * @return {QueryDelete<T>} QueryDelete instance
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function Delete<T extends DbHelperModel>(model: T | {new(): T }): QueryDelete<T> {
    return new QueryDelete(model);
}
