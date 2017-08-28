import { Query } from '@angular/core';
import { Observer } from 'rxjs/Observer';
import { DbQuery } from './db-query.model';
import { QueryResult } from '../interfaces/query-result.interface';

/**
 * @class PendingDbQuery, is a part of private API
 * it is a combination of dbQuery and linked observer to stack the query
 * during connector activation
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class PendingDbQuery {

    /**
     * @public
     * @constructor pending query constructor to create new stackable query
     * waiting for the connector to be ready
     *
     * @param dbQuery   {@link DbQuery} a db query object with all query informations
     *                  see the class documentation
     * @param observer  {@link Observer<any>} the observer to notify the subscribers query state
     */
    public constructor(public dbQuery: DbQuery, public observer: Observer<QueryResult<any>>) {}
}
