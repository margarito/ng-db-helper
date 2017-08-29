import { BadColumnDeclarationError } from '../../errors/bad-column-declaration.error';
import { ModelManager } from '../../managers/model-manager';
import { DbHelperModel } from '../db-helper-model.model';
import { DbRelationModel } from './db-relation.model';
import { TableConfig } from '../../decorators/configurator/table.configurator';
import { DbColumn } from './db-column.model';

/**
 * @public
 * @class DbTable
 *
 * @description
 * This class is a table model to help model migration to do his soup
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export class DbTable {
    /**
     * @private
     * @static
     * @constant {string} RELATIONS_DEFAULT_KEY the default relation key
     */
    private static readonly RELATIONS_DEFAULT_KEY = 'default';

    /**
     * @public
     * @property {string} name cannot be an option information and is the table
     * name in database
     */
    public name: string

    /**
     * @public
     * @property {number} version, the table model version, information to help migration
     */
    public version? = 0;

    /**
     * @public
     * @property {Array<DbColumn>} columnList is an array of DbColumn listing each column
     * sql properties
     */
    public columnList = <DbColumn[]>[];

    /**
     * @public
     * @property {{[index: string]: DbColumn}} column key/value column list with column name as key
     */
    public columns = <{[index: string]: DbColumn}>{};

    /**
     * @public
     * @property {{[index: string]: DbColumn}} fields key/value column list with field name as key
     */
    public fields = <{[index: string]: DbColumn}>{};

    /**
     * @public
     * @property {string} modelName the model name
     */
    public modelName: string;

    /**
     * @public
     * @property {{[index: string]: {[index: string]: DbRelationModel}}} relations two dimensional relation access by
     * model name and relation key
     */
    public relations = <{[index: string]: {[index: string]: DbRelationModel}}>{};

    /**
     * @public
     * @method configure methode to configure table from configurator object
     *
     * @param {TableConfig} config the configurator
     *
     * @since 0.2
     */
    public configure(config: TableConfig) {
        if (config.version) {this.version = config.version}
    }

    /**
     * @public
     * @method hasAutoIncrementedPrimaryKey check if table has auto increment column
     *
     * @return {boolean} true if table has auto increment column
     *
     * @since 0.2
     */
    public hasAutoIncrementedPrimaryKey(): boolean {
        for (const column of this.columnList) {
            if (column.primaryKey && column.autoIncrement) {
                return true;
            }
        }
        return false;
    }

    /**
     * @public
     * @method hasNoPrimaryKey check if table has no primary key
     *
     * @return {boolean} return true if table has no primary key
     *
     * @since 0.2
     */
    public hasNoPrimaryKey(): boolean {
        for (const column of this.columnList) {
            if (column.primaryKey) {
                return false;
            }
        }
        return true;
    }

    /**
     * @public
     * @method getPrimaryColumns get column playing primary role among table's columns
     *
     * @return {Array<DbColumn>} the structured primary column list
     *
     * @since 0.2
     */
    public getPrimaryColumns(): DbColumn[] {
        const columns = <DbColumn[]>[];
        for (const column of this.columnList) {
            if (column.primaryKey) {
                columns.push(column);
            }
        }
        return columns;
    }

    /**
     * @public
     * @method addRelation add relation to table model
     *
     * @param {{new(): DbHelperModel}} model    the target model of the relation
     * @param {DbRalationModel} relation        the relation
     * @param {string} key                      optional key to manage multiple relations to the same model
     *
     * @since 0.2
     */
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

    /**
     * @public
     * @method getRelation get relation from the targetted model and the optionale relation key
     *
     * @param {{new(): DbHelperModel}} model    the target model of the relation
     * @param {string} key                      optional key to manage multiple relations to the same model
     *
     * @return {DbRelationModel} the relation matching to the properties, return is null if no relation matches
     *
     * @since 0.2
     */
    public getRelation(model: {new(): DbHelperModel}, key?: string): DbRelationModel|null {
        if (this.relations.hasOwnProperty(model.name) && this.relations[model.name].hasOwnProperty(key || DbTable.RELATIONS_DEFAULT_KEY)) {
            return this.relations[model.name][key || DbTable.RELATIONS_DEFAULT_KEY];
        }
        return null;
    }
}
