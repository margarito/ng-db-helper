import { ColumnConfig } from './../models/column-config';
import { Clause } from './../models/clause';
import { QueryEngine } from './../singletons/query-engine';
import { Deferer } from './../../utils/models/deferer';

export function Column(config?) {
    return (target: any, key: string) => {
        let column = {
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

        if (config.primaryKey || config.unique) {
            let fnName = 'getBy';
            if (key.length > 1) {
                fnName +=  key.substring(0, 1).toUpperCase() + key.substring(1, key.length - 1);
            } else {
                fnName += key.toUpperCase();
            }
        }
    };
}
