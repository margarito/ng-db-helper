import { QueryConnector } from './core/interfaces/query-connector.interface';
import { ModelMigration } from './core/interfaces/model-migration.interface';

/**
 * @class NgDbHelperModuleConfig is a config model for the module.
 * Future release version may have default values to make easier the module
 * integration.
 *
 * @author  Olivier Margarit
 * @Since   0.1
 */
export class NgDbHelperModuleConfig {
    /**
     * @property version, the model version
     */
    public version = '';

    /**
     * @property autoIncrementVersion, flag to auto increment version with the number of
     * model declared, this is a trick for developpement issues due to compilator import
     * optimisation. Your model, even if it is define will not be imported in the project
     * until it is used.
     * To prevent misunderstanding of what is happening this option aim to automatically
     * call model migration on model use and mange new table creation without manually
     * increment the model version.
     */
    public autoIncrementVersion = true;

    /**
     * @property queryConnector, the connector which the module delegate rdb queries with
     * sqlite standards and more.
     * You can use your own or use a predefine one of the module that allow you to use
     * cordova-sqlite-storage or websql or both depending on the javascript engine support.
     * See {@link MixedCordovaSqliteWebsqlConnector}, {@link CordovaSqliteConnector} or
     * {@link WebsqlConnector} for requirement and usage.
     */
    public queryConnector: QueryConnector;

    /**
     * @property modelMigration, is a callback for model migration and creation. Module
     * connectors have their own logic and it could be overrided from the connector config.
     * By default you can use module connectors as model migration managers.
     * See {@link MixedCordovaSqliteWebsqlConnector}, {@link CordovaSqliteConnector} or
     * {@link WebsqlConnector} for usage.
     */
    public modelMigration: ModelMigration;
}
