export class ClauseComparators {
    public static DIFF = '!=';
    public static LT = '<';
    public static LTE = '<=';
    public static GT = '>';
    public static GTE = '>=';
    public static LIKE = 'LIKE';
    public static IN = 'IN';
    public static EQ = '=';

    public static isKeyOf(val: string): boolean {
        return ClauseComparators.hasOwnProperty(val.toUpperCase());
    }

    public static valueOf(val: string): string {
       return  (ClauseComparators as {[index: string]: any})[val.toUpperCase()];
    }
}
