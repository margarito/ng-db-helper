import { QueryError } from '../../errors/query.error';
import { QueryPart } from './query-part.model';
import { DbHelperModel } from '../db-helper-model.model';
import { retryWhen } from 'rxjs/operator/retryWhen';
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
 * @class QueryUpdate is private part of the APi.
 * For design reasons this class should not be used directly and
 * will move later. Use this class with {@link Update} function.
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
 * ```typescript
 * // update todo object
 * Update(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class QueryUpdate<T extends DbHelperModel> {
    /**
     * @private
     * @property type the type of statement, should not be modified
     */
    private type = 'UPDATE';

    /**
     * @private
     * @property whereClauses is {@link ClauseGroup} instance containing
     * where clauses
     */
    private whereClauses: ClauseGroup;

    /**
     * @private
     * @property valueSet, set of values where key are column name and value,
     * the value to update.
     */
    private valueSet: {[index: string]: any};

    /**
     * @public
     * @constructor should not be use directly, see class header
     * 
     * @param model {@link DbHelperModel} extention
     */
    public constructor(private model: T | { new (): T}) {}

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup}
     * 
     * @param clauses  ClauseGroup, Clause, Clause list of dictionnary of clauses
     * 
     * @return this instance to chain query instructions
     */
    public where(clauses: Clause|Clause[]|ClauseGroup|Object): QueryUpdate<T> {
        if (!this.whereClauses) {
            this.whereClauses = new ClauseGroup();
        }
        this.whereClauses.add(clauses);
        return this;
    }

    /**
     * @public
     * @method where is the method to add clauses to the where statement of the query
     * see {@link Clause} or {@link ClauseGroup}
     * 
     * @throws {@link QueryError} on set on single model update. set method is for updating
     *          many entries of a specific table target from its class.
     * 
     * @param clauses  ClauseGroup, Clause, Clause list of dictionnary of clauses
     * 
     * @return this instance to chain query instructions
     */
    public set(dict: {[index: string]: any}): QueryUpdate<T> {
        if (this.model.hasOwnProperty('__class')) {
            throw(new QueryError('Try to set values on Update query' +
                ' already containing a model. This is not supported', '', ''))
        }
        if (this.valueSet) {
            // merge values
            for (const key in dict) {
                if (dict.hasOwnProperty(key)) {
                    this.valueSet[key] = dict[key];
                }
            }
        } else {
            this.valueSet = dict;
        }
        return this;
    }

    /**
     * @private
     * @method getValuesFromModel build values part of the query from the model.
     * 
     * @return {@link QueryPart} the values query part of update statement
     */
    private getValuesFromModel(): QueryPart {
        const table = ModelManager.getInstance().getModel(this.model);
        const queryPart = new QueryPart();
        const columnsToUpdate = <string[]>[];
        for (const column of table.columnList) {
            let value = (this.model as {[index:string]: any})[column.field];
            value = value === undefined ? null : value;
            if ((this.model as {[index: string]: any}).__partialWithProjection) {
                if ((this.model as {[index: string]: any}).__partialWithProjection.indexOf(column.name) >= 0 ||
                    (this.model as {[index:string]: any})[column.field]) {
                    columnsToUpdate.push(column.name);
                    queryPart.params.push(value);
                }
            } else {
                columnsToUpdate.push(column.name);
                queryPart.params.push(value);
            }
        }
        queryPart.content = 'SET ' + columnsToUpdate.join(' = (?), ') + ' = (?)';
        return queryPart;
    }

    /**
     * @private
     * @method getValuesFromSet build values part of the query from the set dict.
     * 
     * @return {@link QueryPart} the values query part of update statement
     */
    private getValuesFromSet(): QueryPart {
        const queryPart = new QueryPart();
        for (const key in this.valueSet) {
            if (this.valueSet.hasOwnProperty(key)) {
                queryPart.content += queryPart.content ? ', (?)': '(?)';
                queryPart.params.push(this.valueSet[key]);
            }
        }
        return queryPart;
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     * 
     * @return {@link DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): DbQuery {
        const table = ModelManager.getInstance().getModel(this.model);
        const dbQuery = new DbQuery();
        dbQuery.table = table.name;
        dbQuery.type = this.type;
        if ((this.model as {[index: string]: any}).hasOwnProperty('__rowid')) {
            const clause = new Clause();
            clause.key = 'rowid';
            clause.value = (this.model as {[index: string]: any}).__rowid;
            this.where(clause);
        } else {
            for (const column of table.columnList) {
                if (column.primaryKey) {
                    const clause = new Clause();
                    clause.key = column.name;
                    clause.value = (this.model as {[index:string]:any})[column.field];
                    this.where(clause);
                }
            }
        }
        // setup values to update
        dbQuery.query += this.type + ' ' + dbQuery.table;
        let queryPart: QueryPart;
        if ((this.model as {[index: string]: any}).hasOwnProperty('__class')) {
            queryPart = this.getValuesFromModel();
        } else if (this.valueSet && Object.getOwnPropertyNames(this.valueSet).length) {
            queryPart = this.getValuesFromSet();
        } else {
            throw(new QueryError('No values to update on Update query build, ' +
                'please use set method or call Update with a single model.', '', '')); 
        }
        dbQuery.append(queryPart);

        if (this.whereClauses) {
            dbQuery.query += ' WHERE';
            dbQuery.append(this.whereClauses.build());
        }
        return dbQuery;
    }

    /**
     * @public
     * @method exec to execute the query and asynchronously retreive result.
     * 
     * @return observable to subscribe
     */
    public exec(): Observable<QueryResult<any>> {
        return QueryManager.getInstance().query(this.build());
    }
}

/**
 * @public API
 * @function Update is an helper to update models.
 * For a single model prefer use {@link DbHelperModel.save}
 * 
 * @param T exdends {@link DbHelperModel}, a model declared with table and column annotations
 * 
 * @example
 * ```typescript
 * // update todo object
 * Update(todo).exec().subscribe((qr: QueryResult<any>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Update<T extends DbHelperModel>(model: T | {new(): T}): QueryUpdate<T> {
    return new QueryUpdate(model);
}
