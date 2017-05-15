export class Clause {
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

    public key: string;
    public value: any;
    public not: boolean = false;
    public comparator: string = Clause.COMPARATORS.EQ;
}