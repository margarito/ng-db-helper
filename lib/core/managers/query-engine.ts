import { Injectable } from '@angular/core';
import { Clause } from './../models/clause';
import { ModelManager } from './model-manager';
import { Deferer } from './../models/deferer';
import { Query } from './../models/query';
import { PendingQuery } from './../models/pending-query';

export class QueryEngine {

    public static getInstance(): QueryEngine {
        if (!QueryEngine.instance) {
            QueryEngine.instance = new QueryEngine();
        }
        return QueryEngine.instance;
    }

    private static instance;
    private database;
    private queryQueue: [PendingQuery] = <[PendingQuery]> [];

    set db(db) {
        if (this.database) {
            throw 'Databse is already set !!!!';
        }
        this.database = db;
        this.dequeue();
    }

    get db() {
        return this.database;
    }

    public query(query: string, params: any[], deferred?: Deferer<any>): Promise<any> {
        deferred = deferred || new Deferer<any>();
        if (!params) {
            params = <any[]> [];
        }
        if (!this.db) {
            let pendingQuery = new PendingQuery();
            pendingQuery.query = query;
            pendingQuery.params = params;
            pendingQuery.deferred = deferred;
            this.queryQueue.push(pendingQuery);
            return pendingQuery.deferred.promise;
        }

        this.db.transaction((tx) => {
            //console.log(query + (params ? '[' + params.join(', ') + ']' : '[]'));
            tx.executeSql(query, params, (tx, rs) => {
                deferred.resolve(rs);
            }, (tx, error) => {
                deferred.reject(error);
                console.error('Following query did failed: ' + query);
                console.error('with params: ' + params ? '[' + params.join(', ') + ']' : '[]');
            });
        });
        return deferred.promise;
    }

    public buildQueryAll(table: any, clauses?: Clause[]): Query {
        let query = new Query();
        let w = clauses ? this.buildWhere(clauses) : null;
        query.q += 'SELECT rowid, * FROM ' + table.infos.name + (w ? ' WHERE ' + w.where : '');
        query.p = w ? query.p.concat(w.params) : query.p;
        return query;
    }

    public retrieve<T>(model: Function, clauses?: Clause[]): Promise<T[]> {
        let tableName = ModelManager.getInstance().getTable(model);
        return this.all<T>(tableName, clauses);
    }

    public all<T>(tableName: string, clauses?: Clause[]): Promise<T[]> {
        let table = ModelManager.getInstance().getModel(tableName);
        let query = this.buildQueryAll(table, clauses);
        let deferred = new Deferer<T[]>();
        this.query(query.q, query.p).then((rs) => {
            let entities = <T[]> [];
            for (let i = 0; i < rs.rows.length; i += 1) {
                let entity: T = new table.model();
                let item = rs.rows.item(i);
                for (let column of table.columnList) {
                    if (item.hasOwnProperty(column.name)) {
                        entity[column.field] = item[column.name];
                    }
                }
                entities.push(entity);
            }
            deferred.resolve(entities);
        }, (err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    public get<T>(model: Function, clauses?: Clause[]): Promise<T> {
        let tableName = ModelManager.getInstance().getTable(model);
        return this.getFirstElement(tableName, clauses);
    }

    public getFirstElement<T>(tableName: string, clauses?: Clause[]): Promise<T> {
        let table = ModelManager.getInstance().getModel(tableName);
        let query = this.buildQueryAll(table, clauses);
        let deferred = new Deferer<T>();
        this.query(query.q, query.p).then((rs) => {
            if (rs.rows.length > 0) {
                let entity: T = new table.model();
                let item = rs.rows.item(0);
                for (let column of table.columnList) {
                    if (item.hasOwnProperty(column.name)) {
                        entity[column.field] = item[column.name];
                    }
                }
                deferred.resolve(entity);
            } else {
                deferred.resolve(null);
            }
        }, (err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    private dequeue() {
        while (this.queryQueue.length > 0) {
            let pendingQuery = this.queryQueue.shift();
            this.query(pendingQuery.query, pendingQuery.params, pendingQuery.deferred);
        }
    }

    private buildWhere(clauses: Clause[]): any {
        let i;
        let clause;
        let result = {where: '', params: []};
        if (!Array.isArray(clauses)) {
            return result;
        }
        for (i = 0; i < clauses.length; i += 1) {
            clause = clauses[i];
            if (result.where) {
                result.where += ' AND ';
            }
            if (clause.not) {
                result.where += ' NOT ';
            }
            result.where += clause.key + ' ';
            if ((clause.value === null || clause.value === undefined)  && clause.comparator === Clause.COMPARATORS.EQ) {
                result.where += 'IS';
            } else {
                 result.where += clause.comparator;
            }
            result.where += ' ';
            if (Array.isArray(clause.value)) {
                result.where += ' (\'' + clause.value.join('\', \'') + '\') ';
            } else {
                result.where += ' (?) ';
                result.params.push(clause.value);
            }
        }

        return result;
    };
}
