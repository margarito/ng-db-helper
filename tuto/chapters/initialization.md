# Initialization

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