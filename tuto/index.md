# NgDbHelperModule

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

## Usage index

- [Initialization](./chapters/initialization.md)
- [Create your models](./chapters/model-creation.md)
- Queries
  - [Select](./chapters/query-select.md)
  - [Insert](./chapters/query-insert.md)
  - [Update](./chapters/query-update.md)
  - [Delete](./chapters/query-delete.md)
  - [Create](./chapters/query-create.md)
  - [Raw](./chapters/query-raw.md)
- Advance query clause
  - [Syntaxic clause](./chapters/clause-syntaxic.md)
  - [Group clause](./chapters/clause-group.md)
  - [Composite Clause](./chapters/clause-composite.md)
  - [Sub query](./chapters/clause-sub-query.md)
- Connectors
  - [cordova-sqlite-storage](./chapters/connector-cordova-sqlite-storage.md)
  - [WebSQL](./chapters/connector-websql.md)
  - [cordava-sqlite-storage and WebSQL](./chapters/connector-cordova-sqlite-storage-websql.md)
  - [Create your own connector](./chapters/connector-create-your-own.md)

## Authors

- Olivier Margarit

## License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) file for details.