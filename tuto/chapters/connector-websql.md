# Websql connector

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
