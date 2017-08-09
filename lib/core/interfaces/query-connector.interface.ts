import { Observable } from 'rxjs/Rx';
import { QueryResult } from './query-result.interface';
import { DbQuery } from '../models/db-query.model';

export interface QueryConnector {
    /**
     * query
     */
    query(dbQuery: DbQuery): Observable<QueryResult<any>>;

    /**
     * isReady
     */
    isReady(): boolean;

    /**
     * onReady
     */
    onReady(): Observable<boolean>;

    /**
     * getDbVersion
     */
    getDbVersion(): Observable<string>;
}
