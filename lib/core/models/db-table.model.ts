import { DbColumn } from './db-column.model';
import { TableConfig } from './table-config.model';

/**
 * @class DbTable extends {@link TableConfig} is a table model
 * to help model migration to do his soup
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class DbTable extends TableConfig {
    /**
     * @property name cannot be an option information and is the table
     * name in database
     */
    public name: string;

    /**
     * @property columnList is an array of DbColumn listing each column
     * sql properties
     */
    public columnList: DbColumn[];
}
