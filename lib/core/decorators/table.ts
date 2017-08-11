import { TableConfig } from '../models/table-config.model';
import { DbHelperModel } from '../models/db-helper-model.model';
import { ModelManager } from './../managers/model-manager';

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
