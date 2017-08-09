import { Query } from '@angular/core';
import { Observer } from 'rxjs/Rx';
import { DbQuery } from './db-query.model';
import { QueryResult } from '../interfaces/query-result.interface';

export class PendingDbQuery {

    constructor(public dbQuery: DbQuery, public observer: Observer<QueryResult<any>>) {}
}
