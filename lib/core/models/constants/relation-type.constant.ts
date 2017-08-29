/**
 * @private
 * @class RelationType
 *
 * @description
 * the list of relations type. This class should be converted to an enum in future version
 *
 * @author Olivier Margarit
 *
 * @since 0.2
 */
export class RelationType {
    /**
     * @public
     * @constant {string} ONE_TO_MANY the one to many relation
     */
    public static ONE_TO_MANY = 'OneToMany';

    /**
     * @public
     * @constant {string} ONE_TO_ONE the one to one relation
     */
    public static ONE_TO_ONE = 'OneToOne';

    /**
     * @public
     * @constant {string} MANY_TO_MANY the many to many relation
     */
    public static MANY_TO_MANY = 'ManyToMany';

    /**
     * @public
     * @constant {string} MANY_TO_ONE the many to one relation
     */
    public static MANY_TO_ONE = 'ManyToOne';
}
