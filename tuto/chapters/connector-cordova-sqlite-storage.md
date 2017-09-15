# cordova-sqlite-storage connector

/!\ Requirements: this connector will work only if you add the following cordova plugins in your application,
cordova-sqlite-storage, cordova-plugin-file, cordova-plugin-device

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
