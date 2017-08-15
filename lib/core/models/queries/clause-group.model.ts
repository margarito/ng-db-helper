import { QueryPart } from './query-part.model';
import { Clause } from './clause.model';

/**
 * @public API
 * @class ClauseGroup is a group of clause computed at the same
 * level. Clause group are used for where statement of Select, Update
 * and Delete statement.
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
 * @Since   0.1
 */
export class ClauseGroup {
    private clauses = <Clause[]>[];

    /**
     * @public
     * @constructor could take same parameters as add
     * 
     * @param clauses ClauseGroup, Clause, Clause list of dictionnary of clauses 
     */
    public constructor(clauses?: ClauseGroup|Clause|Clause[]|{[index: string]: any}) {
        if (clauses) {
            this.add(clauses);
        }
    }

    /**
     * @public
     * @method add add one or many clause
     * 
     * @example
     * // create group
     * const group = new ClauseGroup();
     * 
     * // clause with dict notation
     * group.add({isDone: false, bar: 'foo'});
     * 
     * // Adding a clause object
     * const clause = new Clause();
     * clause.key = 'isDone';
     * clause.value = false;
     * group.add(clause);
     * 
     * @param clauses ClauseGroup, Clause, Clause list of dictionnary of clauses
     */
    public add(clauses: ClauseGroup|Clause|Clause[]|{[index: string]: any}) {
        if (clauses instanceof ClauseGroup) {
            this.add(clauses.clauses);
        } else if (clauses instanceof Clause) {
            this.clauses.push(clauses);
        } else if (Array.isArray(clauses)) {
            this.clauses = this.clauses.concat(clauses);
        } else {
            for (const key in clauses) {
                if (clauses.hasOwnProperty(key)) {
                    const clause = new Clause();
                    clause.key = key;
                    clause.value = clauses[key];
                    this.clauses.push(clause);
                }
            }
        }
    }

    /**
     * @public
     * @method build is apart of private API, should move later...
     * it build the clause  group to the string part of the query
     * 
     * @return {@link QueryPart} of the query with the string part and
     *          clauses params.
     */
    public build(): QueryPart {
        const queryPart = new QueryPart;
        for (const clause of this.clauses) {
            if (queryPart.content) {
                queryPart.content += (clause.operator === Clause.OPERATORS.AND) ? Clause.OPERATORS.AND : Clause.OPERATORS.OR;
            }
            queryPart.append(clause.build());
        }
        return queryPart;
    }
}
