# NgDbHelperModule

  See [complete documentation](http://htmlpreview.github.io/?https://github.com/margarito/ng-db-helper/blob/master/documentation/index.html)

  This module is a simple module to simplify persistence with relationnal databases.
  As there is many platforms or devices, this module bring possibility to manage connectors.
  It allows integrators to have a better code portability.

  It can be used with cordova-sqlite-storage, websql or other relationnal database if you
  implement your own connector.

  See example project: [Todos App](https://github.com/margarito/todos-app)

  This is an example of code:
  ```typescript
    @Component({
      selector: 'mgto-todos',
      template: '',
      styles: ''
    })
    class TodosPage implements OnInit {
      public todoQueryResult: QueryResult<Todo>;

      public ngOnInit() {
        // retrieve not done todos
        Select(Todo).where({isDone: false}).exec().subscribe((qr: QueryResult<Todo>) => {
          this.todoQueryResult = qr;
        }, (err) => {
          // manage error
        });
      }

      public checkTodo(todo: Todo) {
        todo.isDone = !todo.isDone;
        todo.save().subscribe(() => {
          // isDone did change and is saved
        }, (err) => {
          // manage error
          // cancel done change
          todo.isDone = !todo.isDone;
        });
      }
    }
  ```

# Getting Started

## Prerequisites

  Your application must be an angular project. Then choose the kind of database supported
  by the target device of your app. This module support can be configured to support Websql
  or cordova-sqlite-storage or both on specific conditions.

  If you have other need and this need is to use a relationnal database, see the connector
  API and you will be able to build your own connector and keep using this API design.

## Installing

  This module is available on official npm registry, with command line from your project,
  use the command below:

  ```shell
    npm install ng-db-helper --save
  ```

  The module is now a part of your dependancies and is ready to be used. See Usage to learn
  about how easy it is !

# Usage

## Initialisation

  Create a file where you will put your db management configuration factory
  and init the configuration when it's time to provide it:

  ```typescript
  import { NgDbHelperModuleConfig } from 'ng-db-helper';
  import { CordovaSqliteConnector } from 'ng-db-helper';
  import { CordovaSqliteConnectorConfiguration } from 'ng-db-helper';

  // Create a function that build the module configuration
  export function getDbHelperModuleConfiguration(): NgDbHelperModuleConfig {
    // This configuration is for CordovaSqliteConnector
    const connectorConfig = new CordovaSqliteConnectorConfiguration();

    // you could customize configuration here but you may not need to do that
    // See connectors part to check possibilities ans behaviour

    // create the cordova-sqlite-storage connector, other connectors are
    // Available, see connectors part to find more browser/device support
    const connector = new CordovaSqliteConnector(connectorConfig);

    // create the module configuration instance
    const config = new NgDbHelperModuleConfig();
    
    // Default module connectors are model migration managers too. you
    // can override migration behaviour from connector's configurations
    config.modelMigration = connector;
    config.queryConnector = connector;

    // setup the version of your data model, it will enable migration script
    // to prevent developpement issues due to import optimization, a minor
    // version is automatically incremented. See more configuration part to
    // learn more.
    config.version = '1';
    return config;
  }
  ```

  With this configuration, you are able to persist datas from cordova-sqlite-storage devices
  compatible. You can use another connector or develop your own connector if you are in
  a situation where neither cordova and websql connector respond to your need.

  Then your just have to include the NgDbHelperModule in your main module:

  ```typescript
    import { NgModule } from '@angular/core';
    import { NgDbHelperModule } from 'ng-db-helper';
    import { getDbHelperModuleConfiguration } from './config/ng-db-helper.configuration'

    @NgModule({
      imports: [
        ...,
        NgDbHelperModule.forRoot(getDbHelperModuleConfiguration),
        ...
      ],
      declarations: [...],
      exports: [...],
      providers: [...]
    })
    class MyAwesomeAppModule {}
  ```

  Your now are ready to declare all your models.

## Declare model

  Model management is based on annotation, the application is designed to prevent declaration
  redundancy. Every data model declaration should be done in the main model class file.

  This an example of what model declaration could be:

  ```typescript
    import { DbHelperModel } from 'ng-db-helper';
    import { Table } from 'ng-db-helper';
    import { Column } from 'ng-db-helper';

    @Table()
    export class Todo extends DbHelperModel {
      @Column({primaryKey: true, autoIncremental: true})
      public id: number;

      @Column()
      public label: string;

      @Column({type: 'boolean'})
      public isDone: boolean;
    }
  ```
  This is as simple as this example, annotations will be enougth to create your data model in database
  and being queriable in your application.

  Rules are simple to get the expected result:
    - extends DbHelperModel,
    - use `@Table` annotation,
    - use `@Column` annotation,
    - never declare properties named with double underscore ('__')

  In details, what does each ng-db-helper tools ?

### extends DbHelperModel

  Model has to extends DbHelperModel to be usable with annotations, implements default model method
  and being used with query helpers.

  ```typescript
    // assume that Todo is a model extending DbHelperModel
    // this what could look like todo editor
    @NgComponent({
      ...
    })
    class TodoComponent implements OnInit {
      // the todo id injected with an html attribute
      // this is just a pretext to show a query
      @Input()
      public todoId?: number;

      // the todo item edited from the view
      public todo: Todo;

      public ngOnInit() {
        if (this.id) {
          // Select the todo item, it is probably to create a TodoService with a getById
          // method and this is what you could put in there
          Select(Todo).where({id: this.id}).exec().subscribe((qr: QueryResult<Todo>) => {
            if (qr.rows.length) {
              this.todo = qr.rows.item(0);
            } else {
              // item has not be found by id...
            }
          }, (err) => {
            // manage query error
          })
        } else {
          // no id is set, it is probably a creation instance of the component
          this.todo = new Todo();
        }
      }

      // method called on save button clicked
      public onSaveButtonPressed() {
        // call save method
        this.todo.save().subscribe((qr: QueryResult<any>) => {
          // do things after todo is saved
        }, (err) => {
          // manage error
        });
      }

      // method called on delete button clicked
      public onDeleteButtonPressed() {
        // call delete method
        this.todo.delete().subscribe((qr: QueryResult<any>) => {
          // do things after todo is saved
        }, (err) => {
          // manage error
        });
      }

    }
    
  ```

### use `@Table` annotation

  Table annotation subscribe your model in the main data model. Then it could be
  a part of the model migration to be represented on database and persisted.

  you can customize the name of the table and its version. Default name is the
  class name and default version is 1.

  ```typescript
    // Table name will be Todo and version will be 1
    @Table()
    class Todo extends DbHelperModel {
      // declare properties and columns
    }
  ```

  ```typescript
    @Table({
      name: 'Todos' // prefer the table name plural
    })
    class Todo extends DbHelperModule {
      // declare properties and columns
    }
  ```

### use `@Column` annotation

  `@Column` is annotation for model fields to configure database column where the value will be stored. See database standard to clearly understand available column configurations. Current available properties are:

| config name   |  type   | default value | description                               |
|---------------|:-------:|:-------------:|-------------------------------------------|
| name          | string  | field name    | the column name                           |
| type          | string  | `'string'`    | type of the column, see sqlite types      |
| primaryKey    | boolean | `false`       | flag to set column primary key            |
| autoIncrement | boolean | `false`       | flag to set column value auto incremented |
| unique        | boolean | `false`       | flag to set column value unique           |
| indexed       | boolean | `false`       | flag to set column value indexed          |

  And in action:

```typescript
    import { DbHelperModel } from 'ng-db-helper';
    import { Table } from 'ng-db-helper';
    import { Column } from 'ng-db-helper';

    @Table()
    export class Todo extends DbHelperModel {
      @Column({
        primaryKey: true,
        autoIncremental: true // no need to set type integer, auto incremental suggest it
      })
      public id: number;

      @Column() // column name will be name, type string...
      public label: string;

      @Column({
        type: 'boolean' // set type boolean
      })
      public isDone: boolean;
    }
  ```

  ___
    /!\ TypeScript is a typed language but not JavaScript. Type cannot be read from field
    annotation. You have to declare compatible type between field and database column, if not queries will fail.
  ___

## Model lifecycle

  Model has a simple lifecycled linked to database management and supported by simple methods:

  ```typescript
    // Create model
    const todo = new Todo();
    todo.save().subscribe(...);

    // Retrieve one model
    Select(Todo).where({id: this.id}).setSize(1).exec()
      .subscribe((qr: QueryResult<Todo>) => {
        if (qr.rows.length) {
          this.todo = qr.rows.item(0);
        }
      }, (err) => this.manageError(err));

    // Retrieve many model
    Select(Todo).exec().subscribe((qr: QueryResult<Todo>) => {
      for (let i = 0; i < qr.rows.length; i++) {
        this.todos.push(qr.rows.item(i));
      }
    }, (err) => this.manageError(err));

    // Update model, simply save it ! Save do his magic to insert or update entry
    this.todo.save().subscribe(...);

    // Delete model
    this.todo.delete().subscribe(...);
  ```

## Queries

All statement builder have the same design pattern. All building method return the statement itself
to chain conditions and being easily readable.

All statement are excuted with the `exec()` method and return a standard `Observable`.

### Select

  Select provide multiple methods returning itself to chain operations et being more semantic.

  example:
  ```typescript
    Select(Todo)
      .where({isDone: false})     // set where clauses
      .groupBy('dueDate')         // set group by clause
      .orderBy('createdAt DESC')  // order items on one or many column
      .setSize(100)         // set size, default is 1000, this allow to paginate results
      .setPage(0)           // set page, default is 0, this allow to target specific page
      .projection(['id', 'isDone', 'label', 'dueDate', 'createdAt'])
        // customize projection, this may be use to optimize query on big object
        // but should not be used if not perf problem is detected
      .subscribe(...);
  ```

  `Select(model: {new(): T})` is a templated function, so that the subscribed success method will directly give
  you instances of the model

  ```typescript
    Select(Todo).subscribe((qr: QueryResult<Todo>) => {
      if (qr.rows.length) {
        const todo = qr.rows.item(0); // todo item is an instance of Todo without any effort

        // do things with your newly instanciated Todo instance !!
      }
    });
  ```

### Insert

  Insert allow single model insertion:

  ```typescript
    Insert(todo).exec().subscribe(...);
  ```

  But prefer use save method on model `todo.save()`.

  Insert is a better solution to insert many model, the helper will optimize insertions:

  ```typescript
    Insert(todos).exec().subscribe(...);
  ```

### Update

  Update is an helper to update a single model:

  ```typescript
    Update(todo).exec().subscribe(...);
  ```

  but you should prefer use `todo.save()`;

  Otherwise it could be used to update multiple entries in one query:

  ```typescript
    // set done on all passed todos
    const dueDatePassedClause = new Clause();
    dueDatePassedClause.key = 'dueDate';
    dueDatePassedClause.value = (new Date()).getTime();
    dueDatePassedClause.comparator = Clause.COMPARATORS.LTE
    Update(Todo).set({isDone: true}).where(dueDatePassedClause).exec().subscribe(...);

    // alternativelly you could do undone task in one week
    Update(Todo)
      .set({dueDate: onWeekLaterDate.getTime()})
      .where(dueDatePassedClause).where({isDone: false})
      .exec().subscribe(...);
  ```

### Delete

  Delete is an helper to delete a single model:

  ```typescript
    Update(todo).exec().subscribe(...);
  ```

  but you should prefer use `todo.delete()`;

  Otherwise it could be used to delete multiple entries in one query:

  ```typescript
    // delete done todos
    Delete(Todo).where({isDone: true}).exec().subscribe(...);

    // delete all todos
    Delete(Todo).exec().subscribe(...);
  ```

### RawQuery

  RawQuery allow integrators to start unmanaged queries but it is strongly deprecated
  to use it only this API. This could totally suppress the interest of using this module.

  ```typescript
    // Select des todo dont l'état done est défini dans la table config
    // Les requête imbriqué n'étant pas encore géré, on peut imaginer une requête
    // de ce type
    RawQuery('SELECT * FROM Todo WHERE isDone =' +
      '(SELECT value FROM Config WHERE name = (?))',
      ['defaultDoneState'], // params of the query
      50, // page size of the query
      0);
  ```

  It's planed to manage complex query soon, be carefull about updates to benefit 
  optimizations and code lisibility.

## Mastering Clauses

  ### Standard Clauses manipulation

  ### Semantic use of clauses

    Feature will be added on future release

  ### Clause imbrication

    Feature will be added on future release 

  ### Query imbrication in clause

    Feature will be added on future release

## Connectors

  ### cordova-sqlite-storage

`cordova-sqlite-storage` is the most use plugin by mobile developper using cordova. This connector
could be the most use with this module. This how to set it up:

```typescript
  import { NgDbHelperModuleConfig } from 'ng-db-helper';
  import { CordovaSqliteConnector } from 'ng-db-helper';
  import { CordovaSqliteConnectorConfiguration } from 'ng-db-helper';

  // Create a function that build the module configuration
  export function getDbHelperModuleConfiguration(): NgDbHelperModuleConfig {
    // This configuration is for CordovaSqliteConnector
    const connectorConfig = new CordovaSqliteConnectorConfiguration();

    // Set up the configuration on the connector
    const connector = new CordovaSqliteConnector(connectorConfig);

    // create the module configuration instance
    const config = new NgDbHelperModuleConfig();
    
    // Default module connectors are model migration managers too. you
    // can override migration behaviour from connector's configurations
    config.modelMigration = connector;
    config.queryConnector = connector;

    config.version = '1';
    return config;
  }
```

As default configuration database will be created in the standard directory and at each version
change, new tables are created. This is options given to you by 
CordovaSqliteConnectorConfiguration by customizing its properties:

  - `dbName` : filename for database on target device, default value is `'database.db'`,
  - `doCopyDb` : flag to create database by copy, other configurations provides source informations, default value is false,
  - `sourceDbName` : the db name to copy from the project files, default value is `'www/assets/'`,
  - `sourceDbPath` : path to the db relative to the root of the project, default is `'database.db'`,
  - `location` : see `cordova-sqlite-storage` location parameter on database open method, default is `'location'`,
  - `initDatamodel` : function called on model initialization, if you add your custom logic, part of previous configuration will not be needed, method signature: `(dataModel: DataModel, db: SQLiteDatabase) => Observable<any>`
  - `upgradeDataModel` : this function is the function to replace to manage model migration, see the method signature: `(dataModel: DataModel, db: SQLiteDatabase, oldVarsion: number) => Observable<any>`. New data model share the new version number and old version is passed too. DataModel object is generated from annotation and the version putted from the configuration, all is here to write migration script.

  ### Websql connector

`Websql` is the standard sql storage for browser, see W3C specification. This connector is the only usable for browser. Be carefull on targer browser, some old browser do not support this API. In this case, the connecto will raise an error.

```typescript
  import { NgDbHelperModuleConfig } from 'ng-db-helper';
  import { WebsqlConnector } from 'ng-db-helper';
  import { WebsqlConnectorConfiguration } from 'ng-db-helper';

  // Create a function that build the module configuration
  export function getDbHelperModuleConfiguration(): NgDbHelperModuleConfig {
    // This configuration is for CordovaSqliteConnector
    const connectorConfig = new WebsqlConnectorConfiguration();

    // Set up the configuration on the connector
    const connector = new WebsqlConnector(connectorConfig);

    // create the module configuration instance
    const config = new NgDbHelperModuleConfig();
    
    // Default module connectors are model migration managers too. you
    // can override migration behaviour from connector's configurations
    config.modelMigration = connector;
    config.queryConnector = connector;

    config.version = '1';
    return config;
  }
```

As default configuration database will be created in the standard directory and at each version
change, new tables are created. This is options given to you by 
CordovaSqliteConnectorConfiguration by customizing its properties:

  - `dbName` : filename for database,
  - `initDatamodel` : function called on model initialization, method signature: `(dataModel: DataModel, db: SQLiteDatabase) => Observable<any>`
  - `upgradeDataModel` : this function is the function to replace to manage model migration, see the method signature: `(dataModel: DataModel, db: SQLiteDatabase, oldVarsion: number) => Observable<any>`. New data model share the new version number and old version is passed too. DataModel object is generated from annotation and the version putted from the configuration, all is here to write migration script.

  ### Mixed cordova-websql connector

This connector is the most adaptive connector. It switch on one of the previous connector considering support and is cordova first. 
As WebsqlConnectorConfiguration is inclusive compared to CordovaSqliteConnectorConfiguration, it is the second configuration that is used to configure the connector :

```typescript
  import { NgDbHelperModuleConfig } from 'ng-db-helper';
  import { MixedCordovaSqliteWebsqlConnector } from 'ng-db-helper';
  import { CordovaSqliteConnectorConfiguration } from 'ng-db-helper';

  // Create a function that build the module configuration
  export function getDbHelperModuleConfiguration(): NgDbHelperModuleConfig {
    // This configuration is for CordovaSqliteConnector
    const connectorConfig = new CordovaSqliteConnectorConfiguration();

    // Set up the configuration on the connector
    const connector = new MixedCordovaSqliteWebsqlConnector(connectorConfig);

    // create the module configuration instance
    const config = new NgDbHelperModuleConfig();
    
    // Default module connectors are model migration managers too. you
    // can override migration behaviour from connector's configurations
    config.modelMigration = connector;
    config.queryConnector = connector;

    config.version = '1';
    return config;
  }
```

As default configuration database will be created in the standard directory and at each version
change, new tables are created. This is options given to you by 
CordovaSqliteConnectorConfiguration by customizing its properties:

  - `dbName` : filename for database on target device, default value is `'database.db'`,
  - `doCopyDb` : flag to create database by copy, other configurations provides source informations, default value is false,
  - `sourceDbName` : the db name to copy from the project files, default value is `'www/assets/'`,
  - `sourceDbPath` : path to the db relative to the root of the project, default is `'database.db'`,
  - `location` : see `cordova-sqlite-storage` location parameter on database open method, default is `'location'`,
  - `initDatamodel` : function called on model initialization, if you add your custom logic, part of previous configuration will not be needed, method signature: `(dataModel: DataModel, db: SQLiteDatabase) => Observable<any>`
  - `upgradeDataModel` : this function is the function to replace to manage model migration, see the method signature: `(dataModel: DataModel, db: SQLiteDatabase, oldVarsion: number) => Observable<any>`. New data model share the new version number and old version is passed too. DataModel object is generated from annotation and the version putted from the configuration, all is here to write migration script.

  ### Customize your own connector

if you need to have your own connector, an interface is provided to build it. See QueryConnector documentation.

## ModelMigration

  ### Understand migration workflow

  ### Existing migration

  ### Customize your migrations

# Todos

  Contact me to suggest missing things on this todo list!

  - [-] Queries
    - [x] select
    - [x] insert
    - [x] update
    - [x] delete
    - [-] Add batch queries feature
    - [-] Manage join tables
    - [-] Add sub queries management to clauses
    - [-] Add sub clause group
    - [-] Allow semantic clause complexity
    - [-] Batch queries
  - [-] Models
    - [x] Table annotation
    - [x] Column annotation
    - [-] Foreign models
    - [-] Foreign keys
    - [-] Manage more types like Date
    - [-] constraint management
    - [-] Create a base service with usefull generic functions
  - [-] Connectors
    - [x] standard interface
    - [x] plugable connector on init config
    - [x] cordova-sqlite-storage connector
    - [x] Websql connector
    - [x] Hybrid connector detecting cordova-sqlite-storage or Websql connector support and activate it
    - [-] Batch queries
    - [-] Default connector configuration
  - [-] Design
    - [-] Pass some possible values for field to enum

# Authors

  - Olivier Margarit

# License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.