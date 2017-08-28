import { ColumnConfig } from '../../decorators/configurator/column.configurator';
/**
 * @class DbColumn extends {@link ColumnConfig} is a column model
 * to help model migration to do his soup
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DbColumn {
    /**
     * @property name, the optional column name, if not set, the column take
     *           the field name as column name
     */
    public name: string

    /**
     * @property field
     */
    public field: string;

    /**
     * @property primaryKey, define the column as primary key of the table,
     *           the default value is false
     */
    public primaryKey = false;

    /**
     * @property autoIncrement, define if the column value is auto incremented
     *           default value is false
     */
    public autoIncrement = false;

    /**
     * @property unique, define if column value should be unique. Default value
     *           is false
     */
    public unique = false;

    /**
     * @property indexed, define if column value should be indexed. Default value
     *           is false
     */
    public indexed = false;

    /**
     * @property type, define type of the column, type must be compatible with
     *           the field type plus the sqlite manged type
     */
    public type = 'string';

    public foreignTable: string|null = null;

    public foreignKey: string|null = null;

    public foreignField: string|null = null;

    public defaultValue: any = undefined;


    public constructor(name?: string) {
        if (name) {
            this.name = name;
            this.field = this.name;
        }
    }

    public configure(config: ColumnConfig) {
        if (config.name) {this.name = config.name}
        if (config.type) {this.type = config.type}
        if (config.primaryKey !== undefined) {this.primaryKey = config.primaryKey}
        if (config.unique !== undefined) {this.unique = config.unique}
        if (config.indexed !== undefined) {this.indexed = config.indexed}
        if (config.autoIncrement !== undefined) {this.autoIncrement = config.autoIncrement}
    }

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
