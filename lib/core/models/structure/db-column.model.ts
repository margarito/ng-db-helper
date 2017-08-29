import { ColumnConfig } from '../../decorators/configurator/column.configurator';

/**
 * @public
 * @class DbColumn
 *
 * @description
 * This class is a column model
 * to help model migration to do his soup
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DbColumn {
    /**
     * @public
     * @property {string} name, the optional column name, if not set, the column take
     *           the field name as column name
     */
    public name: string

    /**
     * @public
     * @property {string} field field name form the declared model
     */
    public field: string;

    /**
     * @public
     * @property {boolean} primaryKey define the column as primary key of the table,
     *           the default value is false
     */
    public primaryKey = false;

    /**
     * @public
     * @property {boolean} autoIncrement define if the column value is auto incremented
     *           default value is false
     */
    public autoIncrement = false;

    /**
     * @public
     * @property {boolean} unique define if column value should be unique. Default value
     *           is false
     */
    public unique = false;

    /**
     * @public
     * @property {boolean} indexed define if column value should be indexed. Default value
     *           is false
     */
    public indexed = false;

    /**
     * @public
     * @property {string} type define type of the column, type must be compatible with
     *           the field type plus the sqlite manged type
     */
    public type = 'string';

    /**
     * @public
     * @property {string} foreignTable foreign table name
     */
    public foreignTable: string|null = null;

    /**
     * @public
     * @property {string} foreignKey foreign key linked to current key
     */
    public foreignKey: string|null = null;

    /**
     * @public
     * @property {string} foreignField field name of the foreign model
     */
    public foreignField: string|null = null;

    /**
     * @public
     * @property {any} defaultValue the default value of the column
     */
    public defaultValue: any = undefined;


    /**
     * @public
     * @constructor Create column instance
     *
     * @param {string} name column name
     */
    public constructor(name?: string) {
        if (name) {
            this.name = name;
            this.field = this.name;
        }
    }

    /**
     * @public
     * @method configure configure the column from configurator model
     *
     * @param {ColumnConfig} config the configurator object
     *
     * @since 0.2
     */
    public configure(config: ColumnConfig) {
        if (config.name) {this.name = config.name}
        if (config.type) {this.type = config.type}
        if (config.primaryKey !== undefined) {this.primaryKey = config.primaryKey}
        if (config.unique !== undefined) {this.unique = config.unique}
        if (config.indexed !== undefined) {this.indexed = config.indexed}
        if (config.autoIncrement !== undefined) {this.autoIncrement = config.autoIncrement}
    }

    /**
     * @public
     * @method fromAlias get aliased column
     *
     * @param {string} alias the alias label
     *
     * @return {DbColumn} the aliased column
     *
     * @since 0.2
     */
    public fromAlias(alias: string): DbColumn {
        const aliasColumn = new DbColumn(alias + '.' + this.name);
        aliasColumn.field = alias + '.' + this.field
        aliasColumn.type = this.type;
        aliasColumn.primaryKey = this.primaryKey;
        aliasColumn.unique = this.unique;
        aliasColumn.indexed = this.indexed;
        aliasColumn.autoIncrement = this.autoIncrement;
        return aliasColumn;
    }
}
