import { DbHelperModel } from '../db-helper-model.model';
import { ModelResult } from './model-result.model';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable, Observer } from 'rxjs/Rx';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

class QuerySelect<T extends DbHelperModel> {
    private type = 'SELECT';
    private whereClauses: ClauseGroup;
    private proj: string[];
    private grpBy: string;
    private ordrBy: string;
    private size = 1000;
    private page = 0;

    constructor(private model: { new(): T ; }) {}

    public projection(proj: string[]): QuerySelect<T> {
        this.proj = proj;
        return this;
    }

    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QuerySelect<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }

    public groupBy(group: string): QuerySelect<T> {
        this.grpBy = group;
        return this;
    }

    public orderBy(order: string): QuerySelect<T> {
        this.ordrBy = order;
        return this;
    }

    public setPage(page: number): QuerySelect<T> {
        this.page = page;
        return this;
    }

    public setSize(size: number): QuerySelect<T> {
        this.size = size;
        return this;
    }


    public build(): DbQuery {
        const dbQuery = new DbQuery();
        dbQuery.page = this.page;
        dbQuery.size = this.size;
        dbQuery.table = ModelManager.getInstance().getModel(this.model).name;
        dbQuery.type = this.type;
        dbQuery.query += this.type;
        if (this.proj) {
            dbQuery.query += ' ' + this.proj.join(', ');
        } else {
            dbQuery.query += ' rowid, *';
        }
        dbQuery.query += ' FROM ' + dbQuery.table;
        if (this.whereClauses) {
            dbQuery.query += ' WHERE';
            dbQuery.append(this.whereClauses.build());
        }
        if (this.grpBy) {
            dbQuery.query += ' GROUP BY ' + this.grpBy;
        }
        if (this.ordrBy) {
            dbQuery.query += ' ORDER BY ' + this.ordrBy;
        }
        return dbQuery;
    }

    public exec(): Observable<QueryResult<T>> {
        return Observable.create((observer: Observer<QueryResult<T>>) => {
            const subscription = QueryManager.getInstance().query(this.build()).subscribe((qr: QueryResult<any>) => {
                observer.next(new ModelResult(qr, this.model, this.proj));
                observer.complete();
            }, (err) => observer.error(err));
        });
    }
}

export function Select<T extends DbHelperModel>(model: { new(): T ; }): QuerySelect<T> {
    return new QuerySelect(model);
}
