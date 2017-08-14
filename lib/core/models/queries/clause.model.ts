import { QueryPart } from './query-part.model';

/**
 * @public API
 * @class Clause is a single clause for where statement.
 * 
 * @example
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
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class Clause {
    /**
     * @public
     * @static
     * @enum OPERATORS, not an enum yet but would be converted soon
     */
    public static OPERATORS = {
        OR: 'OR',
        AND: 'AND'
    };

    /**
     * @public
     * @static
     * @enum COMPARATORS, not an enum yet but would be converted soon
     */
    public static COMPARATORS = {
        DIFF: '!=',
        LT: '<',
        LTE: '<=',
        GT: '>',
        GTE: '>=',
        LIKE: 'LIKE',
        IN: 'IN',
        EQ: '='
    };

    /**
     * @public
     * @property operator is used as join clause condition
     */
    public operator = Clause.OPERATORS.AND;

    /**
     * @public
     * @property key is table column name corresponding to the field
     * to compare with
     */
    public key: string;

    /**
     * @public
     * @property value is the column value to compare with
     */
    public value: any;

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
    public comparator = Clause.COMPARATORS.EQ;

    /**
     * @public
     * @method build should be removed to be a part of the private API
     * 
     * @return {@link QueryPart} of the query with the string part and
     *          clauses params.
     */
    public build(): QueryPart {
        const queryPart = new QueryPart();
        if (this.not) {
            queryPart.content += 'NOT ';
        }
        queryPart.content += this.key + ' ';
        if ((this.value === null || this.value === undefined)  && this.comparator === Clause.COMPARATORS.EQ) {
            queryPart.content += 'IS';
        } else {
            queryPart.content += this.comparator;
        }
        queryPart.content += ' ';
        if (Array.isArray(this.value)) {
            queryPart.content += '(' + Array(this.value.length).fill('(?)').join(', ') + ')';
            queryPart.params = this.value;
        } else {
            queryPart.content += '(?)';
            queryPart.params.push(this.value);
        }
        return queryPart;
    }
}
