/**
 * @public
 * @class ClauseComparators
 *
 * @description
 * list of managed comparators. This class should be converted to an enum in a furture version
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export class ClauseComparators {
    /**
     * @public
     * @constant {string} DIFF the not equal comparator "!="
     */
    public static DIFF = '!=';

    /**
     * @public
     * @constant {string} LT the lower than comparator "<"
     */
    public static LT = '<';

    /**
     * @public
     * @constant {string} LTE the lower than or equals comparator "<="
     */
    public static LTE = '<=';

    /**
     * @public
     * @constant {string} GT the greater than comparator ">"
     */
    public static GT = '>';

    /**
     * @public
     * @constant {string} GTE the greater than equal comparator ">="
     */
    public static GTE = '>=';

    /**
     * @public
     * @constant {string} LIKE the like comparator "LIKE"
     */
    public static LIKE = 'LIKE';

    /**
     * @public
     * @constant {string} IN the in comparator "IN"
     */
    public static IN = 'IN';

    /**
     * @public
     * @default
     * @constant {string} EQ the equal comparator "="
     */
    public static EQ = '=';

    /**
     * @public
     * @static
     * @method isKeyOf check if string is a valid key of ClauseComparator, this check
     * is not case sensitive
     *
     * @param {string} val the value to check
     *
     * @return {boolean} is true if key will return a valid value with {@link ClauseComparator.valueOf}
     */
    public static isKeyOf(val: string): boolean {
        return ClauseComparators.hasOwnProperty(val.toUpperCase());
    }

    /**
     * @public
     * @static
     * @method valueOf get value of ClauseComparator by using a valid key val.
     *
     * @param {string} val the value key
     *
     * @return {boolean} the comparator linked to the key
     */
    public static valueOf(val: string): string {
       return  (ClauseComparators as {[index: string]: any})[val.toUpperCase()];
    }
}
