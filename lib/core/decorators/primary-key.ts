import { Column } from './column';
import { ColumnConfig } from './configurator/column.configurator';
import { DbHelperModel } from '../models/db-helper-model.model';

/**
 * @public
 * @function PrimaryKey
 *
 * @description
 * annotation factory to add on class property that should use {@link Table} annotation.
 * class using this annotation must extends {@link DbHelperModel}.
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
 * @param {ColumConfig} config is column configuration, informations are used to
 *          build DataModel.
 *
 * @return {Function} the annotation
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export function PrimaryKey<T extends DbHelperModel>(config?: ColumnConfig): any {
    if (config) {
        config.primaryKey = true;
    } else {
        config = {primaryKey: true};
    }
    return Column<T>(config);
}
