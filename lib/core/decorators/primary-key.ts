import { Column } from './column';
import { ColumnConfig } from './configurator/column.configurator';
import { DbHelperModel } from '../models/db-helper-model.model';

export function PrimaryKey(config?: ColumnConfig): any {
    if (config) {
        config.primaryKey = true;
    } else {
        config = {primaryKey: true};
    }
    return Column(config);
}
