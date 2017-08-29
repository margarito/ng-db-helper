/**
 * @public
 * @class JoinType
 *
 * @description
 * list of join types. This class should be converted to an enum in a furture version
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export class JoinType {
    /**
     * @public
     * @constant {string} INNER the inner join type
     */
    public static INNER = 'INNER';

    /**
     * @public
     * @constant {string} RIGHT the inner right join type
     */
    public static RIGHT = 'RIGHT';

    /**
     * @public
     * @constant {string} LEFT the inner left join type
     */
    public static LEFT = 'LEFT';

    /**
     * @public
     * @constant {string} FULL the full join type
     */
    public static FULL = 'FULL';

    /**
     * @public
     * @constant {string} CROSS the cross join type
     */
    public static CROSS = 'CROSS';

    /**
     * @public
     * @default
     * @constant {string} DEFAULT no join type, database default
     */
    public static DEFAULT = '';

    /**
     * @public
     * @static
     * @method isValid check if join type is valid
     *
     * @param {string} val the value to check
     *
     * @return {boolean} is true if join type is a valid value
     */
    public static isValid(type: string): boolean {
        return JoinType.hasOwnProperty(type.toUpperCase()) || type === '';
    }
}
