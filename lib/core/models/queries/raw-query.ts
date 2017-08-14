import { QueryError } from '../../errors/query.error';
import { Observable } from 'rxjs/Observable';
import { QueryResult } from '../../interfaces/query-result.interface';
import { QueryManager } from '../../managers/query-manager';
import { DbQuery } from '../db-query.model';

/**
 * @public
 * @function RawQuery allow integrators to make RawQuery, any query not permitted
 *           by the current api will be able here
 *  
 * @param query     the query string
 * @param params    the query paraeters
 * @param size      optional result size
 * @param page      optional result page
 * 
 * @return query object to execute
 */
export function RawQuery(query: string, params: any[], size?: number, page?: number) {
    const types = ['SELECT', 'UPDATE', 'INSERT', 'DELETE'];
    const dbQuery = new DbQuery();
    dbQuery.query = query;
    dbQuery.params = params;
    dbQuery.size = size || 1000;
    dbQuery.page = page || 0;
    const trimedQuery = query.trim();
    let firstWord = trimedQuery.substr(0, trimedQuery.indexOf(" "));
    firstWord = firstWord ? firstWord.toUpperCase(): '';
    if (firstWord && types.indexOf(firstWord[0])) {
        dbQuery.type = firstWord;
    } else {
        throw new QueryError('Unsupported raw query', query, params.join(', '));
    }

    const q = {
        /**
         * @public
         * @method exec to execute the query and asynchronously retreive result.
         * 
         * @return observable to subscribe
         */
        exec: () : Observable<QueryResult<any>> => {
            return QueryManager.getInstance().query(dbQuery);
        }
    }
    return q;
}