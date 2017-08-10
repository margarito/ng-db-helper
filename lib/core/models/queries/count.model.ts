import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable, Observer } from 'rxjs/Rx';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

class QueryCount<T> {
    private type = 'SELECT';
    private whereClauses: ClauseGroup;
    private proj: string[];
    private grpBy: string;

    constructor(private model: { new(): T ; }) {}

    public projection(proj: string[]): QueryCount<T> {
        this.proj = proj;
        return this;
    }

    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryCount<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }

    public groupBy(group: string): QueryCount<T> {
        this.grpBy = group;
        return this;
    }


    public build(): DbQuery {
        const dbQuery = new DbQuery();
        dbQuery.table = ModelManager.getInstance().getModel(this.model).name;
        dbQuery.type = this.type;
        dbQuery.query += this.type;
        if (this.proj) {
            dbQuery.query += ' count(' + this.proj.join(', ') + ')';
        } else {
            dbQuery.query += ' count(*)';
        }
        dbQuery.query += ' FROM ' + dbQuery.table;
        if (this.whereClauses) {
            dbQuery.query += ' WHERE';
            dbQuery.append(this.whereClauses.build());
        }
        if (this.grpBy) {
            dbQuery.query += ' GROUP BY ' + this.grpBy;
        }
        return dbQuery;
    }

    public exec(): Observable<number> {
        return Observable.create((observer: Observer<number>) => {
            QueryManager.getInstance().query(this.build()).subscribe((qr: QueryResult<any>) => {
                if (qr.rows.length) {
                    let key = 'count(*)';
                    if (this.proj) {
                        key = 'count(' + this.proj.join(', ') + ')';
                    }
                    observer.next(qr.rows.item(0)[key]);
                    observer.complete();
                } else {
                    observer.error('no result error...');
                }
            }, (err) => observer.error(err));
        });
    }
}

export function Count<T>(model: { new(): T ; }): QueryCount<T> {
    return new QueryCount(model);
}
