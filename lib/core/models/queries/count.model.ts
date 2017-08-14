import { DbHelperModel } from '../db-helper-model.model';
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
 * @class QueryCount is private part of the APi.
 * For design reasons this class should not be used directly and
 * will move later. Use this class with {@link Count} function.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
 * // count todos
 * Count(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<number>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryCount<T extends DbHelperModel> {
    /**
     * @private
     * @property type the type of statement, should not be modified
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
     * @public
     * @constructor should not be use directly, see class header
     * 
     * @param model {@link DbHelperModel} extention
     */
    public constructor(private model: { new(): T ; }) {}

    /**
     * @public
     * @method projection set the projection to the query
     * 
     * @param proj string list of column name that shoul be in the
     * result item of th query
     * 
     * @return this instance to chain query instructions
     */
    public projection(proj: string[]): QueryCount<T> {
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
    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryCount<T> {
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
    public groupBy(group: string): QueryCount<T> {
        this.grpBy = group;
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

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     * 
     * @return observable to subscribe
     */
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

/**
 * @public API
 * @function Count is an helper to count element from database
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
 * // count todos
 * Count(Todo).where({isDone: false}}).exec().subscribe((QueryResult<number>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Count<T extends DbHelperModel>(model: { new(): T ; }): QueryCount<T> {
    return new QueryCount(model);
}
