import { DbHelperModel } from '../db-helper-model.model';
import { retryWhen } from 'rxjs/operator/retryWhen';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Rx';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

class QueryDelete<T extends DbHelperModel> {
    private type = 'DELETE';
    private whereClauses: ClauseGroup;
    private size = 1000;
    private page = 0;

    constructor(private model: T | {new(): T }) {}

    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryDelete<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }


    public build(): DbQuery {
        const table = ModelManager.getInstance().getModel(this.model);
        const dbQuery = new DbQuery();
        dbQuery.page = this.page;
        dbQuery.size = this.size;
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        dbQuery.query += this.type;
        dbQuery.query += ' FROM ' + table.name;
        if (this.model.hasOwnProperty('__class')) {
            for (const column of table.columnList) {
                if (column.primaryKey) {
                    const clause = new Clause();
                    clause.key = column.name;
                    clause.value = this.model[column.field];
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

    public exec(): Observable<QueryResult<any>> {
        return QueryManager.getInstance().query(this.build());
    }
}

export function Delete<T extends DbHelperModel>(model?: T | {new(): T }): QueryDelete<T> {
    return new QueryDelete(model);
}
