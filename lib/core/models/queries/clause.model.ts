import { QueryPart } from './query-part.model';

export class Clause {
    public static OPERATORS = {
        OR: 'OR',
        AND: 'AND'
    };

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

    public operator = Clause.OPERATORS.AND;
    public key: string;
    public value: any;
    public not = false;
    public comparator = Clause.COMPARATORS.EQ;

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
