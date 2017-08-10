import { QueryError } from '../../errors/query.error';
import { DbHelperModel } from '../db-helper-model.model';
import { retryWhen } from 'rxjs/operator/retryWhen';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable, Observer } from 'rxjs/Rx';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

class QueryInsert<T extends DbHelperModel> {
    private static SQLITE_PRAMS_LIMIT = 999;
    private type = 'INSERT';
    private size = 1000;
    private page = 0;

    constructor(private model: T | T[]) {}


    public build(): DbQuery {
        let table;
        if (Array.isArray(this.model)) {
            if (this.model.length) {
                table = ModelManager.getInstance().getModel(this.model[0]);
            } else {
                return null;
            }
        } else {
            table = ModelManager.getInstance().getModel(this.model);
        }
        const dbQuery = new DbQuery();
        dbQuery.page = this.page;
        dbQuery.size = this.size;
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        const columns = [];

        for (const column of table.columnList) {
            columns.push(column.name);
        }
        dbQuery.query += this.type + ' INTO ' + table.name + ' (' + columns.join(', ') + ') VALUES ';

        const items = Array.isArray(this.model) ? this.model : [this.model];
        const valuesStrings = [];
        const parameters = [];
        for (const item of items) {
            const interrogationMarks = [];
            for (const column of table.columnList) {
                parameters.push(item[column.field]);
                interrogationMarks.push('?');
            }
            valuesStrings.push('(' + interrogationMarks.join(', ') + ')');
        }
        dbQuery.query += valuesStrings.join(', ');
        dbQuery.params = dbQuery.params.concat(parameters);
        return dbQuery;
    }

    public exec(): Observable<QueryResult<any>> {
        if (Array.isArray(this.model)) {
            let table;
            if (this.model.length) {
                table = ModelManager.getInstance().getModel(this.model[0]);
            } else {
                throw(new QueryError('Try to insert empty array', null, null));
            }
            const maxItemNumberPerRequest = Math.floor(QueryInsert.SQLITE_PRAMS_LIMIT / table.columnList.length);
            const numberOfParts = Math.floor(this.model.length / maxItemNumberPerRequest) + 1;
            if (numberOfParts > 1) {
                return Observable.create((observer: Observer<QueryResult<any>>) => {
                    const observables = [];
                    for (let i = 0; i < numberOfParts; i += 1) {
                        const start = i * maxItemNumberPerRequest;
                        const nextIndex = start + maxItemNumberPerRequest;
                        const end = nextIndex < (this.model as Array<T>).length ? nextIndex : (this.model as Array<T>).length;
                        if (start >= end) {
                            break;
                        }
                        const insert = Insert((this.model as Array<T>).slice(start, end));
                        observables.push(insert.exec());
                    }

                    const subscription = Observable.combineLatest(observables).subscribe((qrs: QueryResult<any>[]) => {
                        let rowsAffected = 0;
                        let insertId = 0;
                        for (const qr of qrs) {
                            rowsAffected += qr.rowsAffected;
                            insertId = Math.max(insertId, qr.insertId);
                        }
                        observer.next({
                            rowsAffected: rowsAffected,
                            insertId: insertId,
                            rows: {
                                length: 0,
                                item: function (i: number) {
                                    return null;
                                }
                            }
                        });
                    }, (err) => observer.error(err));
                });
            }
        }
        return QueryManager.getInstance().query(this.build());
    }
}

export function Insert<T extends DbHelperModel>(model: T | T[]): QueryInsert<T> {
    return new QueryInsert(model);
}
