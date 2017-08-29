import { DbTable } from '../models/structure/db-table.model';
import { TableConfig } from './configurator/table.configurator';
import { DbHelperModel } from '../models/db-helper-model.model';
import { ModelManager } from './../managers/model-manager';

/**
 * @function Table
 * Table annotation factory to add on class extending {@link DbHelperModel}.
 * This annotation declares class in datamodel
 *
 * @example
 * ```typescript
 * @Table()
 * export class Todo extends DbHelperModel {
 *
 *      @PrimaryKey({autoIncremented: true})
 *      public id: number
 *
 *      @Column()
 *      public name: string;
 *
 *      @Column({type: 'long'})
 *      public dueDate: number;
 * }
 * ```
 *
 * @template T @extends DbHelperModel the target model
 *
 * @param {TableConfig} config, table configurator, informations are used to
 *          build DataModel.
 *
 * @return {Function} the annotation
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function Table<T extends DbHelperModel>(config?: TableConfig) {
    return (target: {new(): T}) => {
        target.prototype.TABLE_NAME = config ? config.name : target.name;
        if (!target.prototype.$$dbTable) {
            target.prototype.$$dbTable = new DbTable();
        }
        target.prototype.$$dbTable.name = target.prototype.TABLE_NAME;
        target.prototype.$$dbTable.modelName = target.name;
        target.prototype.$$dbTable.configure(config);
        ModelManager.getInstance().addModel(target.prototype.$$dbTable);
    };
}
