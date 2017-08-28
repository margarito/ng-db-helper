import { IClause } from '../interfaces/i-clause.interface';
import { ColumnClauseValue } from './column-clause-value.model';
import { ClauseGroup } from './clause-group.model';
import { QuerySelect } from './select.model';
import { ClauseComparators } from '../constants/clause-comparators.constant';
import { ClauseOperators } from '../constants/clause-operators.constant';
import { QueryError } from '../../errors/query.error';
import { QueryPart } from './query-part.model';

/**
 * @public API
 * @class Clause is a single clause for where statement.
 *
 * @example
 * ```typescript
 * // Create a group of clauses
 * const group = new ClauseGroup();
 *
 * // create clause to get Todo item where isDone === false
 * const doneClause = new Clause();
 * doneClause.key = 'isDone';
 * doneClause.value = false;
 * group.add(doneClause);
 *
 * // create clause to get Todo item where dueDate <= now
 * const dueDateClause = new Clause();
 * dueDateClause.key = 'dueDate';
 * dueDateClause.value = (new Date()).getTime();
 * dueDateClause.comparator = Clause.COMPARATORS.LTE;
 * group.add(dueDateClause);
 *
 * // start select clause
 * Select(Todo).where(group).exec().subscribe((QueryResult<Todo>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class CompositeClause implements IClause {

    /**
     * @public
     * @property operator is used as join clause condition
     */
    public operator = ClauseOperators.AND;

    private keysValue = <string[]>[];

    private valuesValue = <any[]>[];

    /**
     * @public
     * @property key is table column name corresponding to the field
     * to compare with
     */
    public get keys(): string[] {
        return this.keysValue;
    }

    /**
     * @public
     * @property value is the column value to compare with
     */
    public get values(): any[] {
        return this.valuesValue;
    }

    /**
     * @public
     * @property not is an additionnal operator to invert condition
     */
    public not = false;

    /**
     * @public
     * @property comparator is a comparator that define the type of
     * relation with the value to compare with and the result.
     */
    public comparator = ClauseComparators.EQ;

    public constructor(keys?: string[], values?: any[]) {
        if (keys) {
            this.keysValue = keys;
        }
        if (values) {
            this.valuesValue = values;
        }
    }

    public addKey(value: string) {
        this.keysValue.push(value);
    }

    public addValue(value: any) {
        this.valuesValue.push(value);
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {@link QueryPart} of the query with the string part and
     *          clauses params.
     */
    public build(): QueryPart {
        if (!this.keys && !this.values) {
            throw new QueryError('one clause has no key for column name.', '', '');
        }
        const queryPart = new QueryPart();
        if (this.not) {
            queryPart.appendContent('NOT');
        }
        queryPart.appendContent('(' + this.keysValue.join(', ') + ')');
        queryPart.appendContent(this.comparator);
        queryPart.appendContent('(');
        let isFirst = true;
        for (const value of this.valuesValue) {
            const valueQueryPart = new QueryPart();
            if (!isFirst) {
                valueQueryPart.appendContent(',');
            } else {
                isFirst = false;
            }
            if (Array.isArray(value)) {
                valueQueryPart.appendContent('(' + Array(value.length).fill('(?)').join(', ') + ')');
                valueQueryPart.params = value;
            } else if (value instanceof ColumnClauseValue) {
                valueQueryPart.appendContent(value.fqn());
            } else {
                valueQueryPart.appendContent('(?)');
                valueQueryPart.params.push(value === undefined ? null : value);
            }
            queryPart.append(valueQueryPart);
        }

        queryPart.appendContent(')');
        return queryPart;
    }
}
