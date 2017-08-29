import { CompositeClause } from './composite-clause.model';
import { IQueryHelper } from '../interfaces/i-query-helper.interface';
import { IJoin } from '../interfaces/i-join.interface';
import { QueryJoin } from './join.model';
import { DbColumn } from '../structure/db-column.model';
import { DbHelperModel } from '../db-helper-model.model';
import { ModelResult } from './model-result.model';
import { DbTable } from '../structure/db-table.model';
import { QueryManager } from '../../managers/query-manager';
import { QueryResult } from '../../interfaces/query-result.interface';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { ModelManager } from '../../managers/model-manager';
import { DbQuery } from '../db-query.model';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';

/**
 * @public
 * @class QuerySelect
 *
 * @description
 * For design reasons this class should not be used directly. Use this class with {@link Select} function.
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // select todos
 * Select(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<Todo>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class QuerySelect<T extends DbHelperModel> implements IQueryHelper {
    /**
     * @private
     * @constant {string} type query type
     */
    private readonly type = 'SELECT';

    /**
     * @private
     * @property {Array<IJoin>} joins list of join for the query
     */
    private joins = <IJoin[]>[];

    /**
     * @private
     * @property {ClauseGroup} whereClauses clause group instance containing where clauses
     */
    private whereClauses: ClauseGroup;

    /**
     * @private
     * @property {Array<string>} proj is the query projection
     */
    private proj: string[];

    /**
     * @private
     * @property {string} grpBy is the group by condition of the query
     */
    private grpBy: string;

    /**
     * @private
     * @property {string} ordrBy order by condition for the query
     */
    private ordrBy: string;

    /**
     * @private
     * @property size, the number of element returned by the select query
     */
    private size = 1000;

    /**
     * @private
     * @property {number} page the paginated number of the query select
     */
    private page = 0;

    /**
     * @private
     * @property {string} alias the query alias to prevent column collision
     */
    public alias = '';

    /**
     * @public
     * @constructor should not be use directly, see class header
     *
     * @param {{new(): T}} model extention
     */
    public constructor(private model: {new(): T}) {}

    /**
     * @public
     * @method copy method to copy QuerySelect
     *
     * @return {QuerySelect<T>} the query select copy
     *
     * @since 0.2
     */
    public copy(): QuerySelect<T> {
        const q = Select(this.model).where(this.whereClauses).join(this.joins).groupBy(this.grpBy).orderBy(this.ordrBy);
        if (this.proj) {q.projection(this.proj)}
        return q;
    }

    /**
     * @public
     * @method projection customize the select column of the QueryResult
     *         for performance optimization if needed.
     *
     * @param {Array<string>} proj the projection
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public projection(proj: string[]): QuerySelect<T> {
        this.proj = proj;
        return this;
    }

    /**
     * @public
     * @method join add query join to query select
     *
     * @param {IJoin|Array<IJoin>} joinQuery join query or list of join queries
     *
     * @return {QuerySelect<T>} the instance itself to chain operation
     */
    public join(joinQuery: IJoin | IJoin[]): QuerySelect<T> {
        let joins;
        if (!Array.isArray(joinQuery)) {
            joins = [joinQuery];
        } else {
            joins = joinQuery;
        }
        for (const jq of joins) {
            if (!jq) {
                continue;
            }
            if (!jq.alias) {
                jq.alias = 'join_' + this.joins.length;
            }
            this.joins.push(jq);
        }
        return this;
    }

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup} or {@link CompositeClause}
     *
     * @param {Clause|Clause[]|CompositeClause|ClauseGroup|{[index: string]: any}} clauses  where clauses
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public where(clauses: Clause|Clause[]|CompositeClause|ClauseGroup|{[index: string]: any}): QuerySelect<T> {
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
     * @param {string} group string whith the column to group by
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public groupBy(group: string): QuerySelect<T> {
        this.grpBy = group;
        return this;
    }

    /**
     * @public
     * @method orderBy add order by instructions to the query
     *
     * @param {string} order string whith the column to order by
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public orderBy(order: string): QuerySelect<T> {
        this.ordrBy = order;
        return this;
    }

    /**
     * @public
     * @method setPage set the page result for pagination
     *
     * @param {number} page page number of the result
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public setPage(page: number): QuerySelect<T> {
        this.page = page;
        return this;
    }

    /**
     * @public
     * @method setSize set the size of the page result for pagination
     *
     * @param {number} size page size number of the result
     *
     * @return {QuerySelect<T>} this instance to chain query instructions
     */
    public setSize(size: number): QuerySelect<T> {
        this.size = size;
        return this;
    }

    /**
     * @public
     * @method getProjectedTable get virtual table representing the result table expected
     *
     * @return {DbTable} the virtual table
     */
    public getProjectedTable(): DbTable {
        const srcTable = ModelManager.getInstance().getModel(this.model);
        const table = new DbTable();
        table.name = srcTable.name;
        table.modelName = srcTable.modelName;
        if (this.proj) {
            const projection = this.proj.slice();
            for (const column of srcTable.columnList) {
                const index = projection.indexOf(column.name);
                if (index >= 0) {
                    table.columns[column.name] = column;
                    table.fields[column.field] = column;
                    table.columnList.push(column);
                    projection.slice(index, 1);
                }
            }
            for (const name of projection) {
                const dbColumn = new DbColumn(name);
                dbColumn.field = name;
                table.columns[dbColumn.name] = dbColumn;
                table.columnList.push(dbColumn);
                table.fields[dbColumn.field] = dbColumn;
            }
        } else {
            for (const column of srcTable.columnList) {
                table.columnList.push(column);
                table.columns[column.name] = column;
                table.fields[column.field] = column;
            }
            if (table.columns.hasOwnProperty('rowid')) {
                const rowidColumn = new DbColumn('rowid');
                rowidColumn.indexed = true;
                rowidColumn.autoIncrement = true;
                rowidColumn.field = '$$rowid';
                rowidColumn.type = 'integer';
                table.columns[rowidColumn.name] = rowidColumn;
                table.columnList.push(rowidColumn);
                table.fields[rowidColumn.field] = rowidColumn;
            }
        }
        if (this.joins) {
            for (const joinQuery of this.joins) {
                const joinTable = joinQuery.getProjectedTable();
                for (const column of joinTable.columnList) {
                    const joinColumn = column.fromAlias(joinQuery.alias)
                    table.columnList.push(joinColumn);
                    table.columns[joinColumn.name] = joinColumn;
                    table.fields[joinColumn.field] = joinColumn;
                }
            }
        }
        return table;
    }

    /**
     * @private
     * @method getJoinProjection get the projection of join query
     *
     * @return {string} the projection
     */
    private getJoinProjection(): string {
        let joinProjection = '';
        if (this.joins) {
            const columns = <string[]>[];
            for (const joinQuery of this.joins) {
                const joinTable = joinQuery.getProjectedTable();
                for (const column of joinTable.columnList) {
                    columns.push(joinQuery.alias + '.' + column.name);
                }
            }
            joinProjection = columns.join(', ');
        }
        return joinProjection;
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {DbQuery} of the query with the string part and
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
        if (this.joins && this.joins.length && !this.proj) {
            dbQuery.query += ', ' + this.getJoinProjection();
        }
        dbQuery.query += ' FROM ' + dbQuery.table;
        for (const joinQuery of this.joins) {
            dbQuery.append(joinQuery.build());
        }
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
     * @return {Observable<QueryResult<T>>} observable to subscribe and retrieve typed result
     */
    public exec(): Observable<QueryResult<T>> {
        return QueryManager.getInstance().query(this.build()).map((qr: QueryResult<any>) => {
            return new ModelResult(qr, this.model, this.proj);
        });
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     *
     * @return {Observable<QueryResult<any>>} observable to subscribe and retrieve result
     *
     * @since 0.2
     */
    public execRaw(): Observable<QueryResult<any>> {
        return QueryManager.getInstance().query(this.build());
    }
}

/**
 * @public
 *
 * @function Select
 *
 * @description
 * This function is an helper to select models inherited from {@link DbHelperModel}
 * from the database
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // select todos
 * Select(Todo).where({isDone: false}}).exec().subscribe((qr: QueryResult<Todo>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @return {QuerySelect<T>} the new query select instance.
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function Select<T extends DbHelperModel>(model: { new(): T }): QuerySelect<T> {
    return new QuerySelect(model);
}
