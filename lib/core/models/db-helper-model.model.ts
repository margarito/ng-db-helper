import { Column } from '../../..';
import { ShadowValue } from './shadow-value.model';
import { Subject } from 'rxjs/Subject';
import { IClause } from './interfaces/i-clause.interface';
import { ClauseComparators } from './constants/clause-comparators.constant';
import { ClauseOperators } from './constants/clause-operators.constant';
import { NotImplementedError } from '../errors/not-implemented.error';
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
 * @public
 * @abstract
 * @class DbHelperModel
 *
 * @description
 * This abstract class is the base of models managed by the orm
 * it provides base method and fields to do the query magic
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
export abstract class DbHelperModel {
    /**
     * @public
     * @property {string} TABLE_NAME property is setted by the table annotation
     *           this property will be readonly in future release
     */
    public TABLE_NAME: string;

    /**
     * @public
     * @property {number} $$rowid is the standard sqlite rowid, this property is used
     *           to check if the model is already save and is setted on select
     *           queries.
     */
    public $$rowid: number | null = null;

    /**
     * @public
     * @property {boolean} $$inserted is a library helper to manage update or insert operation
     */
    public $$inserted = false;

    /**
     * @public
     * @property {Array<string>} $$partialWithProjection is a reference to prevent to nullify fields not
     *           not retrieve field on a select projection.
     */
    public $$partialWithProjection: string[] | undefined;

    /**
     * @public
     * @property {{[index: string]: ShadowValue}} $$shadow shadow model that map real values corresponding with database values
     *
     * @since 0.2
     */
    public $$shadow = <{[index: string]: ShadowValue}> {};

    /**
     * @public
     * @property {DbTable} $$dbTable the table matching to the model
     */
    public $$dbTable: DbTable | undefined;

    /**
     * @public
     * @property {boolean} $$isModified flag updated on model change, in future version this value sould be observable
     *
     * @since 0.2
     */
    public $$isModified = true;

    /**
     * @public
     * @property {boolean} $$isDbHelperModel flag to reflexive check if the model is a DbHelperModel
     *
     * @since 0.2
     */
    public readonly $$isDbHelperModel = true;

    /**
     * @public
     * @constructor Create a model instance. Call to super() is mandatory. If super() is not called, magic will fail.
     *
     * @since 0.2
     */
    public constructor() {
        const table = ModelManager.getInstance().getModel(this.constructor as {new(): DbHelperModel});
        for (const column of table.columnList) {
            const shadow = new ShadowValue();
            shadow.column = column;
            if (column.defaultValue !== undefined) {
                this.setFieldValue(column.field, column.defaultValue);
            }
            this.$$shadow[column.name] = shadow;
        }
    }

    /**
     * @public
     * @method save the model method to save it in database
     *
     * @return {Observable<any>} observable to subscribe to save operation
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

    /**
     * @public
     * @method restoreFromStorage restore or reset the model data from database
     *
     * @return {Observable} observable to subscribe
     *
     * @since 0.2
     */
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

    /**
     * @public
     * @method hasValidRowid check if model has a valid rowid
     *
     * @return {boolean} true if $$rowid is usable
     *
     * @since 0.2
     */
    public hasValidRowid(): boolean {
        return !!this.$$rowid || this.$$rowid === 0;
    }

    /**
     * @public
     * @method toClauseGroup convert model to clause group
     *
     * @return {ClauseGroup} the result clause group
     */
    public toClauseGroup(): ClauseGroup {
        const group = new ClauseGroup();
        for (const key in this.$$shadow) {
            if (this.$$shadow.hasOwnProperty(key)) {
                const shadow = this.$$shadow[key];
                if (shadow.column.autoIncrement && !shadow.val && shadow.val !== 0) {
                    continue;
                }
                const clause = new Clause();
                clause.key = key;
                clause.value = shadow.val === undefined ? null : shadow.val;
                if (!shadow.val && shadow.foreign) {
                    shadow.val = shadow.foreign.getColumnValue(shadow.column.foreignKey!);
                }
                group.add(clause);
            }
        }
        if (this.hasValidRowid()) {
            group.add({rowid: this.$$rowid});
        }
        return group;
    }

    /**
     * @public
     * @method getPrimaryClause get composite clause of primary key to query model
     *
     * @return {IClause} clause object that could be where clause to requery or update stored data
     */
    public getPrimaryClause(): IClause {
        const clause = new CompositeClause();
        clause.comparator = ClauseComparators.IN;
        const values = <any[]>[];
        for (const key in this.$$shadow) {
            if (this.$$shadow.hasOwnProperty(key)) {
                const shadow = this.$$shadow[key];
                if (shadow.foreign) {
                    shadow.val = shadow.foreign.getColumnValue(shadow.column.foreignKey!);
                }
                if (shadow.column.primaryKey && (!shadow.column.autoIncrement || (shadow.val !== undefined && shadow.val !== null))) {
                    clause.addKey(shadow.column.name);
                    values.push(shadow.val === undefined ? null : shadow.val);
                }
            }
        }
        clause.addValue(values);
        return clause;
    }

    /**
     * @public
     * @method hasValidPrimaryKey check if model has usable primary keys
     *
     * @return {boolean} return true if primary can be used
     */
    public hasValidPrimaryKey(): boolean {
        for (const key in this.$$shadow) {
            if (this.$$shadow.hasOwnProperty(key)) {
                const shadow = this.$$shadow[key];
                if (shadow.column.foreignKey) {
                    if (shadow.foreign) {
                        shadow.val = shadow.foreign.getColumnValue(shadow.column.foreignKey);
                    }
                }
                if (shadow.val === undefined || (shadow.column.autoIncrement && shadow.val === null)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * @public
     * @method getColumnValue get a column value by using the column name
     *
     * @param {string} columnName the column name
     *
     * @return {any} the column value stored in database
     */
    public getColumnValue(columnName: string): any {
        if (!this.$$shadow.hasOwnProperty(columnName)) {
            throw new BadColumnDeclarationError('Value for column "' + columnName +
                '" can\'t be retrieve because this column is missing on model "' + this.$$dbTable!.name + '"');
        }
        const shadow = this.$$shadow[columnName];
        if (shadow.column.foreignKey) {
            if (shadow.foreign) {
                shadow.val = shadow.foreign.getColumnValue(shadow.column.foreignKey);
            }
        }
        let value;
        value = shadow.val;
        return value;
    }

    /**
     * @public
     * @method setColumnValue set the column value and bypass the field filter
     *
     * @param {string} columnName   the column to update
     * @param {any} value           the value to set
     *
     * @since 0.2
     */
    public setColumnValue(columnName: string, value: any) {
        if (!this.$$shadow.hasOwnProperty(columnName)) {
            throw new BadColumnDeclarationError('Value for column "' + columnName +
                '" can\'t be retrieve because this column is missing on model "' + this.$$dbTable!.name + '"');
        }
        const shadow = this.$$shadow[columnName];
        const oldVal = shadow.val;
        shadow.val = value;
        if (oldVal !== value && oldVal !== undefined) {
            this.$$isModified = true;
        }
    }

    /**
     * @public
     * @method getFieldValue get the field value by its name
     *
     * @param {string} fieldName the field name from which retrieve the value
     *
     * @return {any} the field value
     */
    public getFieldValue(fieldName: string): any {
        return (this as {[index: string]: any})[fieldName];
    }

    /**
     * @public
     * @method setFieldValue set the field value by its name
     *
     * @param {string} fieldName    the field to update
     * @param {any} value           the value to set
     */
    public setFieldValue(fieldName: string, value: any) {
        (this as {[index: string]: any})[fieldName] = value;
    }

    /**
     * @public
     * @method delete delete the object from database
     *
     * @return {Observable<any>} observable to subscribe to delete operation
     */
    public delete(): Observable<any> {
        return Delete(this).exec();
    }

    /**
     * @public
     * @method getLinkedModelClauses get linked model clauses
     *
     * @param {{new(): T}} model    the linked model
     * @param {string} key          the optional relation key
     *
     * @return {CompositeClause} the target model clause to retrieve it
     *
     * @since 0.2
     */
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

    /**
     * @public
     * @method getLinked get linked model whatever is the relation type
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {{new(): T}} model        the generic model to retrieve
     * @param {string} key              the relation key
     *
     * @throws {QueryError} generic error thrown if relation is invalid or query fail
     *
     * @return {Observable<QueryResult<>>} Observable to subscribe and manage linked result
     *
     * @since 0.2
     */
    public getLinked<T extends DbHelperModel>(model: {new(): T}, key?: string): Observable<QueryResult<T>> {
        return Select(model).where(this.getLinkedModelClauses(model, key)).exec();
    }

    /**
     * @private
     * @method getOneToManyClause get one to many clause for specific model
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {{new(): T}} model        Themodel clause wanted
     * @param {DbRelation} relation     the model relation
     *
     * @return {CompositeClause} the clause to retrieve model
     *
     * @since 0.2
     */
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

    /**
     * @private
     * @method getManyToOneClause get many to one clause for specific model
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {{new(): T}} model        Themodel clause wanted
     * @param {DbRelation} relation     the model relation
     *
     * @return {CompositeClause} the clause to retrieve model
     *
     * @since 0.2
     */
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

    /**
     * @private
     * @method getOneToOneClause get one to one clause for specific model
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {{new(): T}} model        Themodel clause wanted
     * @param {DbRelation} relation     the model relation
     *
     * @return {CompositeClause} the clause to retrieve model
     *
     * @since 0.2
     */
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

    /**
     * @private
     * @method getManyToManyClause get many to many clause for specific model
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {{new(): T}} model        Themodel clause wanted
     * @param {DbRelation} relation     the model relation
     *
     * @return {CompositeClause} the clause to retrieve model
     *
     * @throws {NotImplementedError} this method is not implemented yet
     *
     * @since 0.2
     */
    private getManyToManyClause<T extends DbHelperModel>(model: {new(): T}): CompositeClause {
        throw new NotImplementedError('Many to many linked not implemented yet');
        // return Select(model).exec();
    }

    /**
     * @public
     * @method linkModel link other model to this instance
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {Array<T>} model          The models to link
     * @param {string} key              the relation key
     *
     * @throws {QueryError} generic error thrown if relation is invalid or query fail.
     *                      Throw error if model array is empty
     *
     * @return {Observable<QueryResult<T>>} the new linked models
     *
     * @since 0.2
     */
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

    /**
     * @public
     * @method linkModelsManyToMany link many to many model to this instance
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {Array<T>} model          The models to link
     * @param {string} key              the model relation
     * @param {boolean} remove          flag to unlink model or link it
     *
     * @throws {NotImplementedError} This method is not implemented yet
     *
     * @return {Observable<QueryResult<T>>} the new linked models
     *
     * @since 0.2
     */
    private linkModelsManyToMany<T extends DbHelperModel>(models: T[], key?: string, remove?: boolean): Observable<QueryResult<T>> {
        throw new NotImplementedError('Many to many linked not implemented yet');
    }

    /**
     * @public
     * @method linkModelsStraight link model in the staight relation to this instance
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {Array<T>} model          The models to link
     * @param {string} key              the model relation
     * @param {boolean} remove          flag to unlink model or link it
     *
     * @throws {QueryError} generic error thrown if relation is invalid or query fail.
     *                      Throw error if model array is empty
     *
     * @return {Observable<QueryResult<T>>} the new linked models
     *
     * @since 0.2
     */
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

     /**
     * @public
     * @method linkModelsReverse reverse link model relation to this instance
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {Array<T>} model          The models to link
     * @param {string} key              the model relation
     * @param {boolean} remove          flag to unlink model or link it
     *
     * @throws {QueryError} generic error thrown if relation is invalid or query fail.
     *                      Throw error if model array is empty
     *
     * @return {Observable<QueryResult<T>>} the new linked models
     *
     * @since 0.2
     */
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

    /**
     * @public
     * @method unlinkModels unlink model relation to this instance
     *
     * @param T @extends DbHelperModel  generic model managed by this framework
     * @param {Array<T>} model          The models to unlink
     * @param {string} key              the model relation
     * @param {boolean} remove          flag to unlink model or link it
     *
     * @throws {QueryError} generic error thrown if relation is invalid or query fail.
     *                      Throw error if model array is empty
     *
     * @return {Observable<QueryResult<T>>} the new linked models
     *
     * @since 0.2
     */
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
