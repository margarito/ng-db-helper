import { DbHelperModel } from '../models/db-helper-model.model';
import { DataModel } from '../models/data-model.model';
import { BadColumnDeclarationError } from '../errors/bad-column-declaration.error';
import { BadTableDeclarationError } from '../errors/bad-table-declaration.error';

export class ModelManager {
    public static version: string = '';
    private static instance = new ModelManager();
    private tables: { [index:string] : any } = {};
    private models: { [index:string] : string } = {};

    public static getInstance() {
        return ModelManager.instance;
    }

    public addModel(newModel: { new(): DbHelperModel }) {
        this.tables[newModel.prototype.TABLE_NAME] = {
            name: newModel.prototype.TABLE_NAME,
            columns: newModel.prototype.columns,
            columnList: newModel.prototype.columnList,
            fields: newModel.prototype.fields,
            model: newModel
        };
        this.models[newModel.name] = newModel.prototype.TABLE_NAME;
    }

    public getColumnNameForField(model: any, fieldName: string): string {
        if (!this.models.hasOwnProperty(model.name)) {
            const error = new BadColumnDeclarationError('Did you forget to declare model: ' +
                model.name + '\n Check @Table déclaration on this model');
            throw(error);
        }
        const tableName = this.models[model.name];
        const table = this.tables[tableName];

        if (!table.fields.hasOwnProperty(fieldName)) {
            const error = new BadTableDeclarationError('Did you forget to declare column for field "' +
            fieldName + '" of model "' + model.name + ' - tableName : ' +  tableName + ' table : ' + table + '' +
            '"\n Check @Column déclaration on this model');
            throw(error);
        }
        return table.fields[fieldName].name;
    }

    public getDataModel(): DataModel {
        return new DataModel(this.tables);
    }

    public getModelCount(): number {
        return Object.getOwnPropertyNames(this.models).length;
    }

    public getModel(model: string | DbHelperModel | {new(): DbHelperModel }): any {
        if (model instanceof String) {
            return this.tables[model];
        } else if (model instanceof DbHelperModel) {
            return this.tables[this.getTable(model.__class)];
        } else {
            return this.tables[this.getTable(model)];
        }
    }

    public getTable(model: {new(): DbHelperModel }): string {
        return this.models[model.name];
    }
}
