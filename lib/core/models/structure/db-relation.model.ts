import { ModelManager } from '../../managers/model-manager';
import { DbColumn } from './db-column.model';
import { BadColumnDeclarationError } from '../../errors/bad-column-declaration.error';
import { RelationType } from '../constants/relation-type.constant';
import { DbHelperModel } from '../db-helper-model.model';

export class DbRelationModel {
    private dbColumns = <DbColumn[]>[];

    public get sourceModel(): {new(): DbHelperModel} {
        if (this.reverse) {
            return this.targetModel;
        }
        return this.srcModel;
    }

    public get targetModel(): {new(): DbHelperModel} {
        if (this.reverse) {
            return this.srcModel;
        }
        return this.foreignModel;
    }

    public get columns(): DbColumn[] {
        return this.dbColumns;
    }

    public get isReverse(): boolean {
        return this.reverse;
    }

    public get type(): string|null {
        if (this.reverse && this.relationType === RelationType.MANY_TO_ONE) {
            return RelationType.ONE_TO_MANY;
        }
        return this.relationType;
    }

    public key: string|null = null;

    private relationType: string|null = null;

    public constructor(
        private srcModel: {new(): DbHelperModel},
        private foreignModel: {new(): DbHelperModel},
        private reverse = false
    ) {}

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
