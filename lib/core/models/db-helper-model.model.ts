import { ShadowValue } from './shadow-value.model';
import { Subject } from 'rxjs/Subject';
import { IClause } from './interfaces/i-clause.interface';
import { ClauseComparators } from './constants/clause-comparators.constant';
import { ClauseOperators } from './constants/clause-operators.constant';
import { NotImplementedError } from '../errors/unsatisfied-requirement.error.1';
import { DbRelationModel } from './structure/db-relation.model';
import { QueryError } from '../errors/query.error';
import { RelationType } from './constants/relation-type.constant';
import { Query } from '@angular/core';
import { DbTable } from './structure/db-table.model';
import { QueryResult } from '../interfaces/query-result.interface';
import { Select } from './queries/select.model';
import { RestoreDataError } from '../errors/restore-data.error';
import { Clause } from './queries/clause.model';
import { CompositeClause } from './queries/composite-clause.model';
import { ClauseGroup } from './queries/clause-group.model';
import { BadColumnDeclarationError } from '../errors/bad-column-declaration.error';
import { ModelManager } from '../managers/model-manager';
import { Insert } from './queries/insert.model';
import { Delete } from './queries/delete.model';
import { Update } from './queries/update.model';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

/**
 * @abstract
 * @class DbHelperModel is the base of models manage by the orm
 * it provides base method and fields to do the query magic
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export abstract class DbHelperModel {
    /**
     * @property TABLE_NAME, property is setted by the table annotation
     *           this property will be readonly in future release
     */
    public TABLE_NAME: string;

    /**
     * @property $$rowid is the standard sqlite rowid, this property is used
     *           to check if the model is already save and is setted on select
     *           queries.
     */
    public $$rowid: number | null = null;

    /**
     * @property $$inserted is a library helper to manage update or insert operation
     */
    public $$inserted = false;

    /**
     * @property $$partialWithProjection is a reference to prevent to nullify fields not
     *           not retrieve field on a select projection.
     */
    public $$partialWithProjection: string[] | undefined;

    public $$shadow = <{[index: string]: ShadowValue}>{};

    public $$dbTable: DbTable | undefined;

    public $$isModified = true;

    public readonly $$isDbHelperModel = true;

    /**
     * @public
     * @method save the model method to save it in database
     *
     * @return Observable to subscribe to save operation
     */
    public save(): Observable<any> {
        if (this.$$partialWithProjection && !this.hasValidRowid() && !this.hasValidPrimaryKey()) {
            throw new RestoreDataError('Cannot save or restore data from projection without primary key or rowid,' +
                'add rowid or primary kies to the projection or customize Update to do what you expect.');
        }
        if (this.$$inserted) {
            return Update(this).exec().map(() => {
                this.$$isModified = false;
                return null;
            });
        } else {
            return Observable.create((observer: Observer<any>) => {
                Insert(this).exec().subscribe((res) => {
                    this.$$inserted = true;
                    if (!this.$$rowid && !this.hasValidPrimaryKey()) {
                        this.restoreFromStorage().subscribe(observer);
                    } else {
                        this.$$isModified = false;
                        observer.next(null);
                        observer.complete();
                    }
                }, (err) => observer.error(err));
            });
        }
    }

    public restoreFromStorage(): Observable<any> {
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        const clauseGroup = new ClauseGroup();
        if (this.hasValidRowid()) {
            clauseGroup.add({rowid: this.$$rowid});
        } else if (this.hasValidPrimaryKey()) {
            clauseGroup.add(this.getPrimaryClause);
        } else if (!this.$$partialWithProjection && (table.hasAutoIncrementedPrimaryKey() || table.hasNoPrimaryKey())) {
            clauseGroup.add(this.toClauseGroup());
        } else {
            this.$$inserted = false;
            throw new RestoreDataError('Entity "' + this.constructor.name +
                '" cannot be restored from database. Detailled properties:\n' + JSON.stringify(this));
        }
        return Select(this.constructor as {new(): DbHelperModel}).where(clauseGroup).setSize(1)
            .exec().map((qr: QueryResult<DbHelperModel>) => {
                if (qr.rows.length) {
                    const item = qr.rows.item(0);
                    for (const column of table.columnList) {
                        this.setFieldValue(column.field, item.getFieldValue(column.field));
                    }
                    if (item.hasValidRowid()) {
                        this.$$rowid = item.$$rowid;
                    }
                    this.$$isModified = false;
                } else {
                    this.$$inserted = false;
                    throw new RestoreDataError('Entity "' + this.constructor.name +
                        '" cannot be restored from database. Detailled properties:\n' + JSON.stringify(this));
                }
                return null;
        });
    }

    public hasValidRowid(): boolean {
        return !!this.$$rowid || this.$$rowid === 0;
    }

    public toClauseGroup(): ClauseGroup {
        const group = new ClauseGroup();
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        for (const column of table.columnList) {
            const val = this.getFieldValue(column.field);
            if (column.autoIncrement && !val && val !== 0) {
                continue;
            }
            const clause = new Clause();
            clause.key = column.name;
            if (val && column.foreignKey) {
                clause.value = (val as {[index: string]: any})[column.foreignField!];
            } else {
                clause.value = val === undefined ? null : val;
            }
            group.add(clause);
        }
        if (this.hasValidRowid()) {
            group.add({rowid: this.$$rowid});
        }
        return group;
    }

    public getPrimaryClause(): IClause {
        const clause = new CompositeClause();
        clause.comparator = ClauseComparators.IN;
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        const values = <any[]>[];
        for (const column of table.columnList) {
            if (column.primaryKey && !this.getFieldValue(column.field)) {
                clause.addKey(column.name);
                values.push(this.getFieldValue(column.field));
            }
        }
        clause.addValue(values);
        return clause;
    }

    public hasValidPrimaryKey(): boolean {
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        for (const column of table.columnList) {
            if (column.primaryKey) {
                const fieldValue = this.getFieldValue(column.field);
                if (fieldValue === undefined || (column.autoIncrement && fieldValue === null)) {
                    return false;
                }
            }
        }
        return true;
    }

    public getColumnValue(columnName: string): any {
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        const column = table.columns[columnName];
        if (!column) {
            throw new BadColumnDeclarationError('Value for column "' + columnName +
                '" can\'t be retrieve because this column is missing on model "' + table.name + '"');
        }
        let value: any;
        value = (this as {[index: string]: any})[column.field];
        if (column.foreignKey) {
            if (!value) {
                const foreignValue = value[column.foreignField!];
                if (foreignValue === undefined || foreignValue === null) {
                    throw new QueryError('Model "' + value.constructor.name + '" cannot be affected to Model "' +
                        this.constructor.name + '" because the first one has a null primary key.', '', '');
                }
                value = foreignValue;
            } else {
                value = null;
            }
        }
        return value;
    }

    public getFieldValue(fieldName: string): any {
        return (this as {[index: string]: any})[fieldName];
    }

    public setFieldValue(fieldName: string, value: any) {
        (this as {[index: string]: any})[fieldName] = value;
    }

    /**
     * @public
     * @method delete to delete th object from database
     *
     * @return Observable to subscribe to save operation
     */
    public delete(): Observable<any> {
        return Delete(this).exec();
    }

    private getLinkedModelClauses<T extends DbHelperModel>(model: {new(): T}, key?: string): CompositeClause {
        const table = ModelManager.getInstance().getModel(this);
        const relation = table.getRelation(model, key);
        if (!relation) {
            throw new QueryError(this.constructor.name + ' has no link with ' + model.name, '', '');
        }

        switch (relation.type) {
            case RelationType.ONE_TO_MANY:
                return this.getOneToManyClause(model, relation);
            case RelationType.ONE_TO_ONE:
                return this.getOneToOneClause(model, relation);
            case RelationType.MANY_TO_ONE:
                return this.getManyToOneClause(model, relation);
            case RelationType.MANY_TO_MANY:
                return this.getManyToManyClause(model);
            default:
                throw new QueryError('Invalide relation type', '', '');
        }
    }

    public getLinked<T extends DbHelperModel>(model: {new(): T}, key?: string): Observable<QueryResult<T>> {
        return Select(model).where(this.getLinkedModelClauses(model, key)).exec();
    }

    private getOneToManyClause<T extends DbHelperModel>(model: {new(): T}, relation: DbRelationModel): CompositeClause {
        const foreignKeysClause = new CompositeClause();
        foreignKeysClause.comparator = ClauseComparators.IN;
        const values = <any[]>[];
        for (const column of relation.columns) {
            foreignKeysClause.addKey(column.name);
            values.push(this.getColumnValue(column.foreignKey!));
        }
        foreignKeysClause.addValue(values);
        return foreignKeysClause;
    }

    private getManyToOneClause<T extends DbHelperModel>(model: {new(): T}, relation: DbRelationModel): CompositeClause {
        const foreignKeysClause = new CompositeClause();
        foreignKeysClause.comparator = ClauseComparators.IN;
        const values = <any[]>[];
        for (const column of relation.columns) {
            foreignKeysClause.addKey(column.foreignKey!);
            values.push(this.getColumnValue(column.name!));
        }
        foreignKeysClause.addValue(values);
        return foreignKeysClause;
    }

    private getOneToOneClause<T extends DbHelperModel>(model: {new(): T}, relation: DbRelationModel): CompositeClause {
        const foreignKeysClause = new CompositeClause();
        foreignKeysClause.comparator = ClauseComparators.IN;
        const values = <any[]>[];
        if (relation.isReverse) {
            for (const column of relation.columns) {
                foreignKeysClause.addKey(column.name);
                values.push(this.getColumnValue(column.foreignKey!));
            }
        } else {
                for (const column of relation.columns) {
                foreignKeysClause.addKey(column.foreignKey!);
                values.push(this.getColumnValue(column.name!));
            }
        }
        foreignKeysClause.addValue(values);
        return foreignKeysClause;
    }

    private getManyToManyClause<T extends DbHelperModel>(model: {new(): T}): CompositeClause {
        throw new NotImplementedError('Many to many linked not implemented yet');
        // return Select(model).exec();
    }

    public linkModels<T extends DbHelperModel>(models: T[], key?: string): Observable<QueryResult<T>> {
        if (!models.length) {
            throw new QueryError('can\'t link empty array on "' + this.constructor.name + '"', '', '');
        }
        const modelClass = models[0].constructor as {new(): T};
        const table = ModelManager.getInstance().getModel(this);
        const relation = table.getRelation(modelClass, key);
        if (!relation) {
            throw new QueryError('"' + this.constructor.name + '" has no relation with "' + modelClass.name + '"' +
                (key ? ' and key "' + key + '"' : ''), '', '');
        }
        if (models.length > 1 && relation.type === RelationType.ONE_TO_ONE) {
            throw new QueryError('"' + this.constructor.name + '" could be linked to many models for type one to one',
                '', '');
        }
        if (relation.type === RelationType.MANY_TO_MANY) {
            return this.linkModelsManyToMany(models, key);
        } else if (relation.isReverse) {
            return this.linkModelsReverse(models, key);
        } else {
            return this.linkModelsStraight(models, key);
        }
    }

    private linkModelsManyToMany<T extends DbHelperModel>(models: T[], key?: string, remove?: boolean): Observable<QueryResult<T>> {
        throw new NotImplementedError('Many to many linked not implemented yet');
    }

    private linkModelsStraight<T extends DbHelperModel>(models: T[], key?: string, remove?: boolean): Observable<QueryResult<T>> {
        if (models.length > 1) {
            throw new QueryError('"' + this.constructor.name + '" could be linked to many models for type one to one or many to one',
                '', '');
        }
        const modelClass = this.constructor as {new(): T};
        const model = models[0];

        const linkClause = model.getLinkedModelClauses(modelClass, key);
        const keysToUpdate = linkClause.keys;
        const valuesToSet = linkClause.values[0];
        const set = <{[index: string]: any}>{};
        for (let i = 0; i < keysToUpdate.length; i++) {
            set[keysToUpdate[i]] = remove ? null : valuesToSet[i];
        }

        const subject = new Subject<QueryResult<T>>();
        Update(modelClass).set(set).where(this.getPrimaryClause()).exec().subscribe(() => {
            this.getLinked(modelClass, key).subscribe(subject);
        }, (err) => subject.error(err));
        return subject;
    }

    private linkModelsReverse<T extends DbHelperModel>(models: T[], key?: string, remove?: boolean): Observable<QueryResult<T>> {
        let keys: string[]|null = null;
        let modelClass: {new(): T};
        const values = <any[]>[];
        for (const model of models) {
            const clause = model.getPrimaryClause() as CompositeClause;
            if (!keys) {
                keys = clause.keys;
                modelClass = model.constructor as {new(): T};
            }
            values.push(clause.values[0]);
        }
        const pksClause = new CompositeClause(keys!, values);
        const linkClause = this.getLinkedModelClauses(modelClass!, key);
        const keysToUpdate = linkClause.keys;
        const valuesToSet = linkClause.values[0];
        const set = <{[index: string]: any}>{};
        for (let i = 0; i < keysToUpdate.length; i++) {
            set[keysToUpdate[i]] = remove ? null : valuesToSet[i];
        }

        const subject = new Subject<QueryResult<T>>();
        Update(modelClass).set(set).where(pksClause).exec().subscribe(() => {
            this.getLinked(modelClass, key).subscribe(subject);
        }, (err) => subject.error(err));
        return subject;
    }

    private unlinkModels<T extends DbHelperModel>(models: T[], key?: string): Observable<QueryResult<T>> {
        if (!models.length) {
            throw new QueryError('can\'t link empty array on "' + this.constructor.name + '"', '', '');
        }
        const modelClass = models[0].constructor as {new(): T};
        const table = ModelManager.getInstance().getModel(this);
        const relation = table.getRelation(modelClass, key);
        if (!relation) {
            throw new QueryError('"' + this.constructor.name + '" has no relation with "' + modelClass.name + '"' +
                (key ? ' and key "' + key + '"' : ''), '', '');
        }
        if (models.length > 1 && relation.type === RelationType.ONE_TO_ONE) {
            throw new QueryError('"' + this.constructor.name + '" could be linked to many models for type one to one',
                '', '');
        }
        if (relation.type === RelationType.MANY_TO_MANY) {
            return this.linkModelsManyToMany(models, key, true);
        } else if (relation.isReverse) {
            return this.linkModelsReverse(models, key, true);
        } else {
            return this.linkModelsStraight(models, key, true);
        }
    }
}
