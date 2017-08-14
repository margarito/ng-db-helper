import { DbHelperModel } from '../db-helper-model.model';
import { ModelResult } from './model-result.model';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

/**
 * @private API
 * @class QuerySelect is private part of the APi.
 * For design reasons this class should not be used directly and
 * will move later. Use this class with {@link Select} function.
 * 
 * @param T exdends DbHelperModel, a model declared with table and column annotations
 * 
 * @example
 * // select todos
 * Select(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<Todo>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QuerySelect<T extends DbHelperModel> {
    /**
     * @private
     * @property whereClauses is {@link ClauseGroup} instance containing
     * where clauses
     */
    private type = 'SELECT';

    /**
     * @private
     * @property whereClauses is {@link ClauseGroup} instance containing
     * where clauses
     */
    private whereClauses: ClauseGroup;

    /**
     * @private
     * @property proj is the query projection
     */
    private proj: string[];

    /**
     * @private
     * @property grpBy is the group by condition of the query
     */
    private grpBy: string;

    /**
     * @private
     * @property ordrBy order by condition for the query
     */
    private ordrBy: string;

    /**
     * @private
     * @property size, the number of element returned by the select query
     */
    private size = 1000;

    /**
     * @private
     * @property page, the paginated number of the query select
     */
    private page = 0;

    /**
     * @public
     * @constructor should not be use directly, see class header
     * 
     * @param model {@link DbHelperModel} extention
     */
    public constructor(private model: { new(): T ; }) {}

    /**
     * @public
     * @method projection customize the select column of the QueryResult
     *         for performance optimization if needed.
     * 
     * @param proj the projection
     * 
     * @return this instance to chain query instructions
     */
    public projection(proj: string[]): QuerySelect<T> {
        this.proj = proj;
        return this;
    }

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup}
     * 
     * @param clauses  ClauseGroup, Clause, Clause list of dictionnary of clauses
     * 
     * @return this instance to chain query instructions
     */
    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QuerySelect<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }

    /**
     * @public
     * @method groupBy add group by instructions to the query
     * 
     * @param group string whith the column to group by
     * 
     * @return this instance to chain query instructions
     */
    public groupBy(group: string): QuerySelect<T> {
        this.grpBy = group;
        return this;
    }

    /**
     * @public
     * @method orderBy add order by instructions to the query
     * 
     * @param order string whith the column to order by
     * 
     * @return this instance to chain query instructions
     */
    public orderBy(order: string): QuerySelect<T> {
        this.ordrBy = order;
        return this;
    }

    /**
     * @public
     * @method setPage set the page result for pagination
     * 
     * @param page page number of the result
     * 
     * @return this instance to chain query instructions
     */
    public setPage(page: number): QuerySelect<T> {
        this.page = page;
        return this;
    }

    /**
     * @public
     * @method setSize set the size of the page result for pagination
     * 
     * @param size page size number of the result
     * 
     * @return this instance to chain query instructions
     */
    public setSize(size: number): QuerySelect<T> {
        this.size = size;
        return this;
    }


    /**
     * @public
     * @method build should be removed to be a part of the private API
     * 
     * @return {@link DbQuery} of the query with the string part and
     *          clauses params.
     */
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

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     * 
     * @return observable to subscribe
     */
    public exec(): Observable<QueryResult<T>> {
        return Observable.create((observer: Observer<QueryResult<T>>) => {
            const subscription = QueryManager.getInstance().query(this.build()).subscribe((qr: QueryResult<any>) => {
                observer.next(new ModelResult(qr, this.model, this.proj));
                observer.complete();
            }, (err) => observer.error(err));
        });
    }
}

/**
 * @public API
 * @function Select an helper to select models inherited from {@link DbHelperModel}
 * from the database
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
 * // select todos
 * Select(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<Todo>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Select<T extends DbHelperModel>(model: { new(): T }): QuerySelect<T> {
    return new QuerySelect(model);
}
