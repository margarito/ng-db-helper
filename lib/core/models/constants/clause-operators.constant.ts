export class ClauseOperators {
    public static OR = 'OR';
    public static AND = 'AND';

    public static isKeyOf(val: string): boolean {
        return ClauseOperators.hasOwnProperty(val.toUpperCase());
    }

    public static valueOf(val: String): string {
       return  (ClauseOperators as {[index: string]: any})[val.toUpperCase()];
    }
};
