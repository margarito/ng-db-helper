/**
 * @class ColumnConfig, specific configurator for {@link Column} annotation
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class ColumnConfig {
    /**
     * @property name, the optional column name, if not set, the column take
     *           the field name as column name
     */
    public name?: string;

    /**
     * @property primaryKey, define the column as primary key of the table,
     *           the default value is false
     */
    public primaryKey? = false;

    /**
     * @property autoIncrement, define if the column value is auto incremented
     *           default value is false
     */
    public autoIncrement? = false;

    /**
     * @property unique, define if column value should be unique. Default value
     *           is false
     */
    public unique? = false;

    /**
     * @property indexed, define if column value should be indexed. Default value
     *           is false
     */
    public indexed? = false;

    /**
     * @property type, define type of the column, type must be compatible with
     *           the field type plus the sqlite manged type
     */
    public type? = 'string';
}
