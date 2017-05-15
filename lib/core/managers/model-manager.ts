import { Deferer } from './../models/deferer';

export class ModelManager {
    public static getInstance() {
        if (!ModelManager.instance) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    private static instance;
    private tables = {};
    private models = {};
    private db;

    public addModel(newModel) {
        this.tables[newModel.prototype.TABLE_NAME] = {
            infos: {
                name: newModel.prototype.TABLE_NAME
            },
            columns: newModel.prototype.columns,
            columnList: newModel.prototype.columnList,
            fields: newModel.prototype.fields,
            model: newModel
        };
        this.models[newModel.name] = newModel.prototype.TABLE_NAME;
        console.log( " model in add model => " + newModel.prototype.TABLE_NAME);
    }

    public getColumnNameForField(model: any, fieldName: string): string {
        if (!this.models.hasOwnProperty(model.name)) {
            throw('Did you forget to declare model: ' + model.name + '\n Check @Table déclaration on this model');
        }
        let tableName = this.models[model.name];
        let table = this.tables[tableName];
        for (var prop in this.models) {
         console.log("obj." + prop + " = " + this.models[prop]);
        }
     

         console.log(fieldName + '" of model "' + model.name + ' - tableName : ' +  tableName + ' table : ' + table + " " );

        if (!table.fields.hasOwnProperty(fieldName)) {
            throw('Did you forget to declare column for field "' +
            fieldName + '" of model "' + model.name + ' - tableName : ' +  tableName + ' table : ' + table + " " +
            '"\n Check @Column déclaration on this model');
        }
        return table.fields[fieldName].name;
    }

    public getModel(tableName) {
        return this.tables[tableName];
    }

    public getTable(model) {
        return this.models[model.name];
    }

    public createTablesIfNeeded(db) {
        this.db = db;
        return this.createTablesIfNotExist();
    }

    private query(query) {
        let deferred = new Deferer();

        this.db.transaction((tx) => {
            tx.executeSql(query, [], (tx, rs) => {
                deferred.resolve(rs);
            }, (tx, error) => {
                deferred.reject(error);
                console.error('Failed db query: ' + query);
            });
        });
        return deferred.promise;
    }

    public executeInserts(query) {
        return this.query(query);
    }

    /**
     *  function to check if table EXISTS
     *
     *  @param tableName    {{String}}, the name of the table.
     *
     *  @return             {{Promise}}, angular promise falling on succes if query succeded
   **/
    private checkIftableExists(tableName) {
        let q = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'' + tableName + '\'';
        return this.query(q);
    }

    /**
     *  function to create table
     *
     *  @param tableName    {{String}}, the name of the table.
     *
     *  @return             {{Promise}}, angular promise falling on succes if query succeded
   **/
    private createTable(tableName) {
        let columns = [];
        let query;
        let table = this.tables[tableName];
        for (let key in table.columns) {
            if (table.columns.hasOwnProperty) {
                let column = table.columns[key];
                let value = key + ' ' + (column.autoIncrement ? ' INTEGER' : column.type);
                value += (column.primaryKey ? ' PRIMARY KEY' : '');
                value += (column.autoIncrement ? ' AUTOINCREMENT' : '');
                columns.push(value);
            }
        }
        query = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(',') + ')';
        return this.query(query);
    }

    /**
     *  function that create table if it doesn't exists. All creted databases are logged in config
     *
     *  @param tableName    {{String}}, the name of the table.
     *
     *  @return             {{Promise}}, angular promise falling on succes if query succeded
   **/
    private createTableIfNotExist(tableName): Promise<any> {
        let deferred = new Deferer();
        this.checkIftableExists(tableName).then((result: any) => {
            let _tableName;
            if (result.rows.length > 0) {
                _tableName = result.rows.item(0);
            }
            if (_tableName) {
                //deferred.resolve(false);
                this.query('DROP TABLE ' + tableName).then(() => {
                    this.createTable(tableName).then(() => {
                        deferred.resolve(true);
                    }, deferred.reject);
                }, deferred.reject);
            } else {
                this.createTable(tableName).then(() => {
                    deferred.resolve(true);
                }, deferred.reject);
            }
        }, deferred.reject);
        return deferred.promise;
    }

    /**
     *  function that create tables from config file if they doesn't exist
     *
     *  @return {{Promise}}, angular promise falling on succes if query succeeded
    **/
    private createTablesIfNotExist() {
        let promises = [];
        for (let key in this.tables) {
            if (this.tables.hasOwnProperty(key)) {
                promises.push(this.createTableIfNotExist(key));
            }
        }
        return Promise.all(promises);
    }
}