/**
 * @public
 * @class ClauseOperators
 *
 * @description
 * list of managed operators. This class should be converted to an enum in a furture version
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export class ClauseOperators {
    /**
     * @public
     * @constant {string} OR the or operator "OR"
     */
    public static OR = 'OR';

    /**
     * @public
     * @default
     * @constant {string} AND the and operator "AND"
     */
    public static AND = 'AND';

    /**
     * @public
     * @static
     * @method isKeyOf check if string is a valid key of ClauseOperator, this check
     * is not case sensitive
     *
     * @param {string} val the value to check
     *
     * @return {boolean} is true if key will return a valid value with {@link ClauseOperator.valueOf}
     */
    public static isKeyOf(val: string): boolean {
        return ClauseOperators.hasOwnProperty(val.toUpperCase());
    }

    /**
     * @public
     * @static
     * @method valueOf get value of ClauseOperator by using a valid key val.
     *
     * @param {string} val the value key
     *
     * @return {boolean} the operator linked to the key
     */
    public static valueOf(val: String): string {
       return  (ClauseOperators as {[index: string]: any})[val.toUpperCase()];
    }
};
