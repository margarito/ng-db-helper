import { DbHelperModel } from '../db-helper-model.model';
import { retryWhen } from 'rxjs/operator/retryWhen';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Rx';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

class QueryUpdate<T extends DbHelperModel> {
    private type = 'UPDATE';
    private whereClauses: ClauseGroup;
    private size = 1000;
    private page = 0;
    private table: any;

    constructor(private model: T, private partial: boolean = false) {}

    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryUpdate<T> {
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
        if (this.model.__rowid) {
            const clause = new Clause();
            clause.key = 'rowid';
            clause.value = this.model.__rowid;
            this.where(clause);
        } else {
            for (const column of table.columnList) {
                if (column.primaryKey) {
                    const clause = new Clause();
                    clause.key = column.name;
                    clause.value = this.model[column.field];
                    this.where(clause);
                }
            }
        }
        // setup values to update
        dbQuery.query += this.type + ' ' + dbQuery.table;
        const columnsToUpdate = <string[]>[];
        const values = [];
        for (const column of table.columnList) {
            if (this.model.__partialWithProjection) {
                if (this.model.__partialWithProjection.indexOf(column.name) >= 0 || this.model[column.field]) {
                    columnsToUpdate.push(column.name);
                    values.push(this.model[column.field]);
                }
            } else {
                columnsToUpdate.push(column.name);
                values.push(this.model[column.field]);
            }
        }

        dbQuery.query += ' SET ' + columnsToUpdate.join(' = (?), ') + ' = (?) ';
        dbQuery.params = dbQuery.params.concat(values);

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

export function Update<T extends DbHelperModel>(model: T, partial: boolean = false): QueryUpdate<T> {
    return new QueryUpdate(model, partial);
}
