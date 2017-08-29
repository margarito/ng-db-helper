/**
 * @class ColumnConfig
 *
 * @description
 * specific configurator for {@link Column} annotation
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class ColumnConfig {
    /**
     * @property {string} name, the optional column name, if not set, the column take
     *           the field name as column name
     */
    public name?: string;

    /**
     * @property {boolean} primaryKey, define the column as primary key of the table,
     *           the default value is false
     */
    public primaryKey? = false;

    /**
     * @property {boolean} autoIncrement, define if the column value is auto incremented
     *           default value is false
     */
    public autoIncrement? = false;

    /**
     * @property {boolean} unique, define if column value should be unique. Default value
     *           is false
     */
    public unique? = false;

    /**
     * @property {boolean} indexed, define if column value should be indexed. Default value
     *           is false
     */
    public indexed? = false;

    /**
     * @property {string} type, define type of the column, type must be compatible with
     *           the field type plus the sqlite manged type
     */
    public type? = 'string';
}
