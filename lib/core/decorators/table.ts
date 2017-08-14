import { TableConfig } from '../models/table-config.model';
import { DbHelperModel } from '../models/db-helper-model.model';
import { ModelManager } from './../managers/model-manager';

/**
 * Table annotation to add on class extending {@link DbHelperModel}.
 * This annotation declares class in datamodel
 * 
 * @example
 * @Table
 * export class Todo extends DbHelperModel {
 * 
 *      @Column({primaryKey: true, autoIncremented: tru, type: 'integer'})
 *      public id: number
 * 
 *      @Column
 *      public name: string;
 * 
 *      @Column
 *      public dueDate: string;
 * }
 * 
 * @param config, {@link TableConfig} is table configuration, informations are used to
 *          build DataModel.
 * 
 * @author  Olivier Margarit
 * @Since   0.1
 */
export function Table<T extends DbHelperModel>(config?: TableConfig) {
    return (target: {new(): T}) => {
        target.prototype.TABLE_NAME = config ? config.name : target.name;
        target.prototype.__class = target;
        if (!target.prototype.columns) {target.prototype.columns = {}; };
        if (!target.prototype.columnList) {target.prototype.columnList = []; };
        if (!target.prototype.fields) {target.prototype.fields = []; };
        ModelManager.getInstance().addModel(target);
    };
}
