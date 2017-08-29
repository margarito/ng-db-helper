import { QuerySelect } from './select.model';
import { QueryError } from '../../errors/query.error';
import { DbHelperModel } from '../db-helper-model.model';
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
 * @class QueryCount
 *
 * @description
 * For design reasons this class should not be used directly.
 * Prefer use {@link Count} function.
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // count todos
 * Count(Select(Todo).where({isDone: false}})).exec().subscribe((cout: number) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export class QueryCount<T extends DbHelperModel> {

    /**
     * @public
     * @constructor create instance of QueryCount
     * @param querySelect the query to count the result
     */
    public constructor(private querySelect: QuerySelect<T>) {}

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        return this.querySelect.copy().projection(['count(*)']).build();
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     *
     * @return {Observable<number>} observable to subscribe and returning a count number as result
     */
    public exec(): Observable<number> {
        const dbQuery = this.build();
        return  QueryManager.getInstance().query(dbQuery).map((qr: QueryResult<any>) => {
            if (qr.rows.length) {
                const key = 'count(*)';
                return qr.rows.item(0)[key];
            } else {
                throw new QueryError('no result error...', dbQuery.query, dbQuery.params.join(', '));
            }
        });
    }
}

/**
 * @public
 * @function Count
 *
 * @description
 * function helper to count element that a query could return
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // count todos
 * Count(Select(Todo).where({isDone: false}})).exec().subscribe(count: number) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @return {QueryCount<T>} instance
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export function Count<T extends DbHelperModel>(select: QuerySelect<T>): QueryCount<T> {
    return new QueryCount(select);
}
