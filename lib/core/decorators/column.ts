import { DbHelperModel } from '../models/db-helper-model.model';
import { ColumnConfig } from './../models/column-config.model';
import { Clause } from './../models/queries/clause.model';

/**
 * Column annotation to add on class property that should use {@link Table} annotation.
 * class using this annotation must extends {@link DbHelperModel}.
 * 
 * @example
 * ```typescript
 * @Table
 * export class Todo extends DbHelperModel {
 * 
 *      @Column({primaryKey: true, autoIncremented: tru, type: 'integer'})
 *      public id: number
 * 
 *      @Column
 *      public name: string;
 * 
 *      @Column({type: 'long'})
 *      public dueDate: number;
 * }
 * ```
 * 
 * @param config, {@link ColumnConfig} is column configuration, informations are used to
 *          build DataModel.
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Column<T extends DbHelperModel>(config?: ColumnConfig) {
    return (target: T, key: string) => {
        const column = {
            name: key,
            field: key,
            type: 'string',
            primaryKey: false,
            autoIncrement: false,
            unique: false,
            indexed: false
        };
        if (config) {
            column.name = config.name || key;
            column.type = config.type || column.type;
            column.primaryKey = config.primaryKey || column.primaryKey;
            column.unique = config.unique || column.unique;
            column.indexed = config.indexed || column.indexed;
            column.autoIncrement = config.autoIncrement || column.autoIncrement;
        }

        if (!target.constructor.prototype.columns) {target.constructor.prototype.columns = {}; };
        if (!target.constructor.prototype.columnList) {target.constructor.prototype.columnList = []; };
        if (!target.constructor.prototype.fields) {target.constructor.prototype.fields = {}; };
        target.constructor.prototype.columnList.push(column);
        target.constructor.prototype.columns[column.name] = column;
        target.constructor.prototype.fields[column.field] = column;

        if (config && (config.primaryKey || config.unique)) {
            let fnName = 'getBy';
            if (key.length > 1) {
                fnName +=  key.substring(0, 1).toUpperCase() + key.substring(1, key.length - 1);
            } else {
                fnName += key.toUpperCase();
            }
        }
    };
}
