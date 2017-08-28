import { ModelManager } from '../managers/model-manager';
import { Clause } from '../models/queries/clause.model';
import { QueryResult } from '../interfaces/query-result.interface';
import { Select } from '../models/queries/select.model';
import { Observable } from 'rxjs/Observable';
import { RelationType } from '../models/constants/relation-type.constant';
import { DbRelationModel } from '../models/structure/db-relation.model';
import { DbTable } from '../models/structure/db-table.model';
import { DbColumn } from '../models/structure/db-column.model';
import { DbHelperModel } from '../models/db-helper-model.model';
import { ColumnConfig } from './configurator/column.configurator';

export function ForeignModel<T extends DbHelperModel>(model: {new(): DbHelperModel}, config?: ColumnConfig, relationKey?: string) {
    return (target: T, key: string) => {

        const column = new DbColumn();
        column.field = key;

        if (config) {
            column.configure(config);
        }

        let table: DbTable = target.constructor.prototype.$$dbTable;
        if (!table) {
            table = new DbTable();
            target.constructor.prototype.$$dbTable = table;
        }

        let relation = table.getRelation(model as {new(): DbHelperModel}, relationKey);
        if (!relation) {
            relation = new DbRelationModel(target.constructor as {new(): DbHelperModel}, model);
            table.addRelation(model, relation, relationKey);
        }
        relation.add(column);

        let reverseTable: DbTable = model.prototype.$$dbTable;
        if (!reverseTable) {
            reverseTable =  new DbTable()
            model.prototype.$$dbTable = reverseTable;
        }

        let reverseRelation = table.getRelation(target.constructor as {new(): DbHelperModel}, relationKey);
        if (!reverseRelation) {
            reverseRelation = new DbRelationModel(target.constructor as {new(): DbHelperModel}, model, true);
            reverseTable.addRelation(target.constructor as {new(): DbHelperModel}, reverseRelation, relationKey);
        }
        reverseRelation.add(column);

        // relation compute column name is not set, so wait for it before invoking column.name
        table.columnList.push(column);
        table.columns[column.name] = column;
        table.fields[column.field] = column;

        Object.defineProperty(target, key, {
            get: function () {
                return this.$$shawdow[column.name].foreign;
            },
            set: function (foreign: DbHelperModel) {
                this.$$shawdow[column.name].val = foreign.getFieldValue(column.foreignField!);
                this.$$shawdow[column.name].foreign = foreign;
                this.$$isModified = true;
            },
            enumerable: true,
            configurable: false
        });
    };
}
