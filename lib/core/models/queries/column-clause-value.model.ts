import { QueryPart } from './query-part.model';
import { IQueryHelper } from '../interfaces/i-query-helper.interface';

/**
 * @public
 * @class ColumnClauseValue
 *
 * @description
 * Clause that hold a column comparission with the model that can deliver an alias.
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export class ColumnClauseValue {
    /**
     * @public
     * @property {string} alias the column alias
     */
    public get alias(): string | undefined {
        if (this.aliasing instanceof String) {
            return this.aliasing;
        }
        return undefined;
    }

    /**
     * @public
     * @property {IQueryHelper} querySrc the query object that hold the column and deliver the alias
     */
    public get querySrc(): IQueryHelper | undefined {
        if (!(this.aliasing instanceof String)) {
            return this.aliasing;
        }
        return undefined;
    }

    /**
     * @public
     * @constructor
     *
     * @param {string} name the column name
     * @param {string|IQueryHelper} aliasing optaional param that is the alias or provide it
     */
    public constructor(public name: string, private aliasing?: string | IQueryHelper) {}

    /**
     * @method fqn full qulaified name
     *
     * @return the full name with the namespace alias
     */
    public fqn(): string {
        let fqn: string;
        if (this.aliasing instanceof String) {
            fqn = this.aliasing + '.' + this.name;
        } else if (this.aliasing && this.aliasing.alias) {
            fqn = this.aliasing.alias + '.' + this.name;
        } else {
            fqn = this.name;
        }
        return fqn;
    }
}
