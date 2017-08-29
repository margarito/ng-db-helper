import { ModelManager } from '../../managers/model-manager';
import { DbColumn } from './db-column.model';
import { BadColumnDeclarationError } from '../../errors/bad-column-declaration.error';
import { RelationType } from '../constants/relation-type.constant';
import { DbHelperModel } from '../db-helper-model.model';

/**
 * @public
 * @class DbRelationModel
 *
 * @description
 * This class add relation mapping to the table
 *
 * @author  Olivier Margarit
 * @since   0.2
 */
export class DbRelationModel {
    /**
     * @private
     * @property {Array<DbColumn>} dbColumns list of columns related to other model
     */
    private dbColumns = <DbColumn[]>[];

    /**
     * @public
     * @property {{new(): DbHelperModel}} sourceModel source of the relation
     */
    public get sourceModel(): {new(): DbHelperModel} {
        if (this.reverse) {
            return this.targetModel;
        }
        return this.srcModel;
    }

    /**
     * @public
     * @property {{new(): DbHelperModel}} targetModel target of the relation
     */
    public get targetModel(): {new(): DbHelperModel} {
        if (this.reverse) {
            return this.srcModel;
        }
        return this.foreignModel;
    }

    /**
     * @public
     * @property {Array<DbColumn>} columns columns list of the relation, multiple columns
     * are needed for composite keys
     */
    public get columns(): DbColumn[] {
        return this.dbColumns;
    }

    /**
     * @public
     * @property {boolean} isReverse check the relation direction
     */
    public get isReverse(): boolean {
        return this.reverse;
    }

    /**
     * @public
     * @property {string} type the computed relation type @see RelationType
     */
    public get type(): string|null {
        if (this.reverse && this.relationType === RelationType.MANY_TO_ONE) {
            return RelationType.ONE_TO_MANY;
        }
        return this.relationType;
    }

    /**
     * @public
     * @property {string} key the relation key, allow defining multiple relations between two
     * models and reaching only one of its
     */
    public key: string|null = null;

    /**
     * @private
     * @property {string} relationType the relation type @see RelationType
     */
    private relationType: string|null = null;

    /**
     * @public
     * @constructor create db relation model
     *
     * @param {{new(): DbHelperModel}} srcModel the source model of the relation from the column owner
     * @param {{new(): DbHelperModel}} foreignModel the target model of the relation from the column owner
     * @param {boolean} reverse tag reverse to follow the link reverse from targetted model
     */
    public constructor(
        private srcModel: {new(): DbHelperModel},
        private foreignModel: {new(): DbHelperModel},
        private reverse = false
    ) {}

    /**
     * @public
     * @method add add column to the relation
     *
     * @param {DbColumn} column the column  to add
     */
    public add(column: DbColumn) {
        const table = ModelManager.getInstance().getModel(this.foreignModel);
        let foreignColumn = null;
        if (column.foreignKey) {
            foreignColumn = table.columns[column.foreignKey];
            if (!foreignColumn) {
                throw new BadColumnDeclarationError('Can\'t resolve foreignKey "' +
                    this.srcModel.name + '.' + column.field + '", no primary found in target model "' +
                    this.foreignModel.name + '" with column name "' + column.foreignKey + '".');
            }
        } else {
            const primaryColumns = table.getPrimaryColumns();
            if (primaryColumns.length === 1) {
                foreignColumn = primaryColumns[0];
            } else if (primaryColumns.length > 1) {
                throw new BadColumnDeclarationError('Can\'t resolve foreignKey "' +
                    this.srcModel.name + '.' + column.field + '", multiple primary found in target model "' +
                    this.foreignModel.name + '", add foreign column name in "foreignKey" of the column configurator.');
            } else {
                throw new BadColumnDeclarationError('Can\'t resolve foreignKey "' +
                    this.srcModel.name + '.' + column.field + '", no primary found in target model "' +
                    this.foreignModel.name + '".');
            }
            column.foreignKey = foreignColumn.name;
        }
        if (!column.name) {
            column.name = column.field + foreignColumn.name.slice(0, 1).toLocaleUpperCase() +
                foreignColumn.name.slice(1, foreignColumn.name.length);
        }
        column.foreignTable = table.name;
        column.foreignField = foreignColumn.field;
        column.type = foreignColumn.type;
        this.dbColumns.push(column);
        const relationType = column.unique ? RelationType.ONE_TO_ONE : RelationType.MANY_TO_ONE;
        if (relationType === RelationType.MANY_TO_MANY ||
            this.relationType === null ||
            relationType === RelationType.MANY_TO_ONE) {
            this.relationType = relationType;
        }
    }
}
