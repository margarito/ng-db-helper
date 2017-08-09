import { DbHelperModel } from '../models/db-helper-model.model';
import { Clause } from '../models/clause';
import { QueryEngine } from '../singletons/query-engine';
import { BaseModel } from './../models/base-model';
import { ModelManager } from './../managers/model-manager';
import { TableConfig } from './../models/table-config';

export function Table<T extends DbHelperModel>(config) {
    return (target: {new(): T}) => {
        target.prototype.TABLE_NAME = config.name;
        target.prototype.__class = target;
        if (!target.prototype.columns) {target.prototype.columns = {}; };
        if (!target.prototype.columnList) {target.prototype.columnList = []; };
        if (!target.prototype.fields) {target.prototype.fields = []; };
        ModelManager.getInstance().addModel(target);
    };
}
