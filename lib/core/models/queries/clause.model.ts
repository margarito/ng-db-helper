import { IClause } from '../interfaces/i-clause.interface';
import { ColumnClauseValue } from './column-clause-value.model';
import { ClauseGroup } from './clause-group.model';
import { QuerySelect } from './select.model';
import { ClauseComparators } from '../constants/clause-comparators.constant';
import { ClauseOperators } from '../constants/clause-operators.constant';
import { QueryError } from '../../errors/query.error';
import { QueryPart } from './query-part.model';

/**
 * @public
 *
 * @class Clause
 *
 * @description
 * This entity is a single clause for where statement.
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
export class Clause implements IClause {

    /**
     * @public
     * @property {string} operator is used as join clause condition
     *
     * @default ClauseOperators.AND
     */
    public operator = ClauseOperators.AND;

    private keyValue = '';

    /**
     * @public
     * @method key is table column name corresponding to the field
     * to compare with. Since 0.2, key support complex values. You can use an appended key with
     * [optional]operator + [optional]not + column name + [optional]comparator with space separator
     * or double underscore (__).
     * Be carefull, get key will not return the value set for key. The get method only retrieve the column
     * informations.
     *
     * @example:
     * ```typescript
     *  // function to quickly get current timestamp
     *  function now(): number {
     *      return (new Date()).getTime()
     *  }
     *
     *  // Select all done or passed todo
     *  Select(Todo).where({isDone: true, or__dueDate__lt: now()}).subcribe((qr: QueryResult<Todo>) => {
     *      const ids = <number[]>[];
     *      for (let i = 0; i < qr.rows.length; i++) {
     *          // check if todo really need to be deleted ...
     *          ids.push(qr.rows.item(i).id);
     *      }
     *
     *      Delete(Todo).where(id__in:ids).exec().subscribe(() => {
     *          // todos are delete
     *      }, (err) => {
     *          console.error(err);
     *      })
     *  }, (err) => {
     *      console.error(err);
     *  });
     *
     *  // delete directly without check
     *  Delete(Todo).where({isDone: true, or__dueDate__lt: now()}).subcribe(() => {
     *      // delete done
     *  }, (err) => {
     *      console.error(err);
     *  });
     * ```
     */
    public set key(value: string) {
        const parts = value.split(/__| /);
        const clauseError = new QueryError('key clause is invalid', '', '')
        if (!parts.length || parts.length > 4) {
            throw clauseError;
        }
        if (parts.length === 1) {
            this.keyValue = parts[0];
        } else {
            let currentPartIndex = 0;
            if (ClauseOperators.isKeyOf(parts[0])) {
                this.operator = ClauseOperators.valueOf(parts[0]);
                currentPartIndex++;
            }
            if (parts[currentPartIndex].toUpperCase() === 'NOT') {
                this.not = true;
                currentPartIndex++;
            }

            if (currentPartIndex >= parts.length) {
                return;
            }

            this.keyValue = ClauseComparators.isKeyOf(parts[currentPartIndex]) ?
                ClauseComparators.valueOf(parts[currentPartIndex]) : parts[currentPartIndex];
            currentPartIndex++;

            if (currentPartIndex === parts.length) {
                return;
            }

            if (currentPartIndex === parts.length - 1 && ClauseComparators.isKeyOf(parts[currentPartIndex])) {
                this.comparator = ClauseComparators.valueOf(parts[currentPartIndex]);
            } else {
                throw new QueryError('Clause key "' + value + '" is malformed', '', '');
            }

        }
    }

    /**
     * @public
     * @property key is table column name corresponding to the field
     * to compare with
     */
    public get key(): string {
        return this.keyValue;
    }

    /**
     * @public
     * @property {any} value is the column value to compare with
     */
    public value: any;

    /**
     * @public
     * @property {boolean} not is an additionnal operator to invert condition
     */
    public not = false;

    /**
     * @public
     * @property {string} comparator is a comparator that define the type of
     * relation with the value to compare with and the result.
     *
     * @default ClauseComparators.EQ
     */
    public comparator = ClauseComparators.EQ;

    /**
     * @public
     * @constructor create a new instance of Clause
     * @param {string} key the clause key
     * @param {any} value the clause value
     *
     * @since 0.2
     */
    public constructor(key?: string, value?: any) {
        if (key) {
            this.key = key;
        }
        if (value) {
            this.value = value;
        }
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {QueryPart} of the query with the string part and
     *          clauses params.
     */
    public build(): QueryPart {
        if (!this.key && !(this.value instanceof ClauseGroup || (typeof this.value === 'object' && !(this.value instanceof Date)))) {
            throw new QueryError('one clause has no key for column name.', '', '');
        }
        const queryPart = new QueryPart();
        if (this.not) {
            queryPart.appendContent('NOT');
        }
        queryPart.appendContent(this.key);
        if ((this.value === null || this.value === undefined)  && this.comparator === ClauseComparators.EQ) {
            queryPart.appendContent('IS');
        } else if (
            this.value instanceof ClauseGroup || (
                typeof this.value === 'object' &&
                !(this.value instanceof Date) &&
                !(Array.isArray(this.value))
            )
        ) {
            // no comparator in this case.
        } else {
            queryPart.appendContent(this.comparator);
        }
        if (Array.isArray(this.value)) {
            queryPart.appendContent('(' + Array(this.value.length).fill('(?)').join(', ') + ')');
            queryPart.params = this.value;
        } else if (this.value instanceof QuerySelect) {
            queryPart.appendSub(this.value.build());
        } else if (this.value instanceof ClauseGroup) {
            queryPart.appendSub(this.value.build());
        } else if (typeof this.value === 'object' && this.value !== null && !(this.value instanceof Date)) {
            const group = new ClauseGroup(this.value);
            queryPart.appendSub(group.build());
        } else if (this.value instanceof ColumnClauseValue) {
            queryPart.appendContent(this.value.fqn());
        } else {
            queryPart.appendContent('(?)');
            queryPart.params.push(this.value === undefined ? null : this.value);
        }
        return queryPart;
    }
}
