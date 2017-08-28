import { QueryPart } from './query-part.model';
import { IQueryHelper } from '../interfaces/i-query-helper.interface';

export class ColumnClauseValue {
    public get alias(): string | undefined {
        if (this.aliasing instanceof String) {
            return this.aliasing;
        }
        return undefined;
    }

    public get querySrc(): IQueryHelper | undefined {
        if (!(this.aliasing instanceof String)) {
            return this.aliasing;
        }
        return undefined;
    }

    public constructor(public name: string, private aliasing?: string | IQueryHelper) {}

    /**
     * @method fqn full qulaified name
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
