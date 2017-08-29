import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { QueryResult } from './query-result.interface';
import { DbQuery } from '../models/db-query.model';

/**
 * @public
 * @interface QueryConnector
 *
 * @description
 * This interface allow to customize connector
 * It switch between rdb solution like cordova-sqlite-storage or Websql.
 * The purpose is to be able to switch platform without modifying any line of the application code.
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export interface QueryConnector {
    /**
     * @method query connector method to fire query
     *
     * @param {DbQuery} dbQuery     DbQuery object containing query and query params.
     *                              @see {DbQuery}
     *
     * @return {Obsevable<any>}     passing {@link QueryResult<any>} on query success
     *                              passing {@link QueryError} on query error
     */
    query(dbQuery: DbQuery): Observable<QueryResult<any>>;

    /**
     * @public
     * @method queryBatch connector method to fire many queries in a single transaction
     *
     * @param {DbQuery} dbQueries   DbQuery object containing query and query params.
     *
     * @return {Obsevable<QueryResult<any>>}    passing {@link QueryResult<any>} on query success
     *                                          passing {@link QueryError} on query error
     */
    queryBatch(dbQueries: DbQuery[]): Observable<QueryResult<any>>;

    /**
     * @method isReady to check if module is ready, if not, caller should
     * subscribe to {@link QueryConnector.onReady}
     *
     * @return {boolean} should be true if connector can query else false
     */
    isReady(): boolean;

    /**
     * @method onReady should be subscribed if connector is not ready
     * if connector is ready, if QueryConnector isReady or not this should be
     * a permanent state. The engine never resubscribe in his instance lifecycle.
     *
     * @return {Observable<boolean>}    passing true if connector is ready
     *                                  passing false if connector will never be ready
     */
    onReady(): Observable<boolean>;

    /**
     * @method getDbVersion called to check db version, should be called only if connector
     * is ready. The rdb may need a query so the call is async.
     *
     * @return {Observable<string>}     passing string version after version is checked
     */
    getDbVersion(): Observable<string>;
}
