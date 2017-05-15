import { Clause } from '../models/clause';
import { QueryEngine } from '../singletons/query-engine';
import { BaseModel } from './../models/base-model';
import { ModelManager } from './../singletons/model-manager';
import { TableConfig } from './../models/table-config';

export function Table<T>(config) {
    return (target) => {
        target.prototype.TABLE_NAME = config.name;
        if (!target.prototype.columns) {target.prototype.columns = {}; };
        if (!target.prototype.columnList) {target.prototype.columnList = []; };
        if (!target.prototype.fields) {target.prototype.fields = []; };
        console.log("@Table " + config.name);
        ModelManager.getInstance().addModel(target);
        
       
    }
}