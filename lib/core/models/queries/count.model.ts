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
 * @private API
 * @class QueryCount is private part of the APi.
 * For design reasons this class should not be used directly and
 * will move later. Use this class with {@link Count} function.
 *
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // count todos
 * Count(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<number>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QueryCount<T extends DbHelperModel> {

    public constructor(private querySelect: QuerySelect<T>) {}

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {@link DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        return this.querySelect.copy().projection(['count(*)']).build();
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     *
     * @return observable to subscribe
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
 * @public API
 * @function Count is an helper to count element from database
 *
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // count todos
 * Count(Todo).where({isDone: false}}).exec().subscribe((QueryResult<number>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function Count<T extends DbHelperModel>(select: QuerySelect<T>): QueryCount<T> {
    return new QueryCount(select);
}
