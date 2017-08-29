import { CompositeClause } from './composite-clause.model';
import { IQueryHelper } from '../interfaces/i-query-helper.interface';
import { IJoin } from '../interfaces/i-join.interface';
import { DbTable } from '../structure/db-table.model';
import { ModelManager } from '../../managers/model-manager';
import { ClauseGroup } from './clause-group.model';
import { Clause } from './clause.model';
import { QueryPart } from './query-part.model';
import { QueryError } from '../../errors/query.error';
import { JoinType } from '../constants/join-type.constant';
import { QuerySelect } from './select.model';
import { DbHelperModel } from '../db-helper-model.model';

/**
 * @public
 * @class QueryJoin
 *
 * @description
 * For design reasons this class should not be used directly. Use this class with {@link Join} function.
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // Create new model instance
 * const todo = new Todo();
 * // manipulates todo instance and then insert it
 * const select = Select(Todo);
 * const join = Join(Task).type(JoinType.LEFT).on({id: new ColumnClauseValue('taskId', select)});
 * select.join(join).where({isDone: false}).execRaw().subscribe((qr: QueryResult<any>) => {
 *      // collect todo and task, task column will be prefixed with join.alias value
 * }, (err) => {
 *      console.error(err);
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export class QueryJoin<T extends DbHelperModel> implements IJoin, IQueryHelper {
    /**
     * @private
     * @property {string} joinType
     *
     * @default JoinType.DEFAULT
     */
    private joinType = JoinType.DEFAULT;

    /**
     * @private
     * @property {ClauseGroup} onGroup group of 'on' join conditions
     */
    private onGroup: ClauseGroup | undefined;

    /**
     * @public
     * @property {string} alias alias can be setted by hand or will be automatically setted by the main query
     */
    public alias: string;

    /**
     * @public
     * @constructor
     * @param {{new(): T} | QuerySelect<T>} model the model or sub query select to join
     */
    public constructor(private model: {new(): T} | QuerySelect<T>) {}

    /**
     * @public
     * @method type set join type to join query part
     *
     * @param {string} type see JoinTypes class to check possible values
     *
     * @return {QueryJoin<T>} the current instance to chain operations
     */
    public type(type: string): QueryJoin<T> {
        if (JoinType.isValid(type)) {
            if (type.toUpperCase() === 'DEFAULT') {
                this.joinType = JoinType.DEFAULT;
            } else {
                this.joinType = type;
            }
        } else {
            throw new QueryError('Join type "' + type + '" is invalid.', '', '');
        }
        return this;
    }

    /**
     * @public
     * @method on method to add on join clauses
     *
     * @param {Clause|Clause[]|ClauseGroup|CompositeClause|{[index: string]: any}} clauses on join clauses
     *
     * @return {QueryJoin<T>} the current instance to chain operations
     */
    public on(clauses: Clause|Clause[]|ClauseGroup|CompositeClause|{[index: string]: any}): QueryJoin<T> {
        if (!this.onGroup) {
            this.onGroup = new ClauseGroup();
        }
        this.onGroup.add(clauses);
        return this;
    }

    /**
     * @public
     * @method getProjectedTable get a virtual table to customize query projection and model retrieving
     *
     * @return {DbTable} the virtual model of the joined query
     */
    public getProjectedTable(): DbTable {
        if (this.model instanceof QuerySelect) {
            return this.model.getProjectedTable();
        } else {
            return ModelManager.getInstance().getModel(this.model);
        }
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {DbQuery} of the query with the string part and
     *          clauses params.
     */
    public build(): QueryPart {
        const queryPart = new QueryPart();
        queryPart.content += this.joinType + ' JOIN';
        let table;
        if (this.model instanceof QuerySelect) {
            table = this.model.getProjectedTable();
            queryPart.appendSub(this.model.build());
        } else {
            table = ModelManager.getInstance().getModel(this.model);
            queryPart.appendContent(this.model.name);
        }
        queryPart.appendContent('AS');
        queryPart.appendContent(this.alias);
        queryPart.appendContent('ON');
        if (!this.onGroup) {
            throw new QueryError('you can\'t join "' + this.alias + '" without "on clauses".', '', '');
        }
        queryPart.append(this.onGroup.build());

        return queryPart;
    }
}

/**
 * @public
 * @function Join
 *
 * @description
 * Create a join part of a query to retrieve linked datas to a main query
 *
 * @param T @extends DbHelperModel a model declared with table and column annotations
 *
 * @example
 * ```typescript
 * // Create new model instance
 * const todo = new Todo();
 * // manipulates todo instance and then insert it
 * const select = Select(Todo);
 * const join = Join(Task).type(JoinType.LEFT).on({id: new ColumnClauseValue('taskId', select)});
 * select.join(join).where({isDone: false}).execRaw().subscribe((qr: QueryResult<any>) => {
 *      // collect todo and task, task column will be prefixed with join.alias value
 * }, (err) => {
 *      console.error(err);
 * });
 * ```
 *
 * @return {QueryJoin<T>} a query join instance
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export function Join<T extends DbHelperModel>(model: {new(): T} | QuerySelect<T>): QueryJoin<T> {
    return new QueryJoin(model);
}
