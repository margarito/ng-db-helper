import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Observable';

/**
 * @public
 * @function QueryBatch is an helper to fire many queries. It is usefull to popullate datas
 *
 * @param batchFn function that contains queries
 *
 * @example
 * ```typescript
 *  QueryBatch(() => {
 *      for (const todo of this.todos) {
 *          todo.save();
 *      }
 *  }).subscribe(() => {
 *      // all todos are saved
 *  }, (err) => {
 *      // manage batch error
 *  });
 * ```
 *
 * @author Olivier Margarit
 * @since 0.2
 */
export function QueryBatch(batchFn: () => void): Observable<QueryResult<any>> {
    const queryManager = QueryManager.getInstance();
    queryManager.startBatch(this);
    batchFn();
    return queryManager.execBatch(this);
}
