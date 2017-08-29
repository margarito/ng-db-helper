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
 * @class CompositeClause
 *
 * @description
 * Clause that allow integrators to compare tuple of value like in this raw query:
 * "SELECT * FROM Animals WHERE (species, color) IN (('dog', 'white'), ('cat', 'ginger'), ('bird', 'blue'))"
 *
 * @example
 * ```typescript
 * // Create a group of clauses
 * const composite = new CompositeClause(['species', 'color'], [['dog', 'white'], ['cat', 'ginger'], ['bird', 'blue']]);
 * composite.comparator = ClauseCompators.IN
 *
 * // start select clause
 * Select(Animal).where(composite).exec().subscribe((QueryResult<Animal>) => {
 *      // do something with the result...
 * }, (err) => {
 *      // do something with the error...
 * });
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export class CompositeClause implements IClause {

    /**
     * @public
     * @property {string} operator is used as join clause condition
     *
     * @default ClauseOperators.AND
     */
    public operator = ClauseOperators.AND;

    /**
     * @private
     * @property {Array<string>} keysValue list of column from the composite clause
     */
    private keysValue = <string[]>[];

    /**
     * @private
     * @property {Array<any>} valuesValue list of values matching with the column keys to compare with
     */
    private valuesValue = <any[]>[];

    /**
     * @public
     * @property {Array<string>} key is table column name corresponding to the field
     * to compare with
     */
    public get keys(): string[] {
        return this.keysValue;
    }

    /**
     * @public
     * @property {Array<any>} value is the column value to compare with
     */
    public get values(): any[] {
        return this.valuesValue;
    }

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
     * @constructor create new instance of composite clause
     * @param {Array<string>} keys optional list of columns from the composite clause to compare with
     * @param {Array<any>} values optional list of values to compare with
     */
    public constructor(keys?: string[], values?: any[]) {
        if (keys) {
            this.keysValue = keys;
        }
        if (values) {
            this.valuesValue = values;
        }
    }

    /**
     * @public
     * @method addKey add column to compare with
     *
     * @param {string} value the column reference
     */
    public addKey(value: string) {
        this.keysValue.push(value);
    }

    /**
     * @public
     * @method addValue add value to compare with
     * @param {any} value the value to compare with
     */
    public addValue(value: any) {
        this.valuesValue.push(value);
    }

    /**
     * @public
     * @method build should be removed to be a part of the private API
     *
     * @return {QueryPart} query part of the query with the string part and
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
