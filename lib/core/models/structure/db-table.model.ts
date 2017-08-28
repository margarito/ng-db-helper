import { BadColumnDeclarationError } from '../../errors/bad-column-declaration.error';
import { ModelManager } from '../../managers/model-manager';
import { DbHelperModel } from '../db-helper-model.model';
import { DbRelationModel } from './db-relation.model';
import { TableConfig } from '../../decorators/configurator/table.configurator';
import { DbColumn } from './db-column.model';

/**
 * @class DbTable extends {@link TableConfig} is a table model
 * to help model migration to do his soup
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DbTable {
    private static RELATIONS_DEFAULT_KEY = 'default';
    /**
     * @property name cannot be an option information and is the table
     * name in database
     */
    public name: string

    /**
     * @property version, the table model version, information to help migration
     */
    public version? = 0;

    /**
     * @property columnList is an array of DbColumn listing each column
     * sql properties
     */
    public columnList = <DbColumn[]>[];

    /**
     * @property column
     */
    public columns = <{[index: string]: DbColumn}>{};

    /**
     * @property fields
     */
    public fields = <{[index: string]: DbColumn}>{};

    /**
     * @property modelName
     */
    public modelName: string;

    public relations = <{[index: string]: {[index: string]: DbRelationModel}}>{};

    public configure(config: TableConfig) {
        if (config.version) {this.version = config.version}
    }

    public hasAutoIncrementedPrimaryKey(): boolean {
        for (const column of this.columnList) {
            if (column.primaryKey && column.autoIncrement) {
                return true;
            }
        }
        return false;
    }

    public hasNoPrimaryKey(): boolean {
        for (const column of this.columnList) {
            if (column.primaryKey) {
                return false;
            }
        }
        return true;
    }

    public getPrimaryColumns(): DbColumn[] {
        const columns = <DbColumn[]>[];
        for (const column of this.columnList) {
            if (column.primaryKey) {
                columns.push(column);
            }
        }
        return columns;
    }

    public addRelation(model: {new(): DbHelperModel}, relation: DbRelationModel, key?: string) {
        if (this.relations.hasOwnProperty(model.name) && this.relations[model.name].hasOwnProperty(key || DbTable.RELATIONS_DEFAULT_KEY)) {
            throw new BadColumnDeclarationError('relation with key "' + (key || DbTable.RELATIONS_DEFAULT_KEY) + '" is inserted twice');
        } else {
            if (!this.relations[model.name]) {
                this.relations[model.name] = <{[index: string]: DbRelationModel}>{}
            }
            this.relations[model.name][key || DbTable.RELATIONS_DEFAULT_KEY] = relation;
        }
    }

    public getRelation(model: {new(): DbHelperModel}, key?: string): DbRelationModel|null {
        if (this.relations.hasOwnProperty(model.name) && this.relations[model.name].hasOwnProperty(key || DbTable.RELATIONS_DEFAULT_KEY)) {
            return this.relations[model.name][key || DbTable.RELATIONS_DEFAULT_KEY];
        }
        return null;
    }
}
