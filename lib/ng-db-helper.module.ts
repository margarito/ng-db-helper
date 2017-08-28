import { NgDbHelperModuleConfig } from './ng-db-helper-module-config';
import { ModuleWithProviders, NgModule, Optional } from '@angular/core';
import { QueryManager } from './core/managers/query-manager';

/**
 * @module NgDbHelperModule the awesome module to help developers to manage their
 * data model and its persistance. Just add the module to your main module with
 * the config that you need and enjoy it !
 *
 * Future version may have default connector and model migration to make it more easy
 * to use.
 *
 * @example
 *
 * ```typescript
 *  function getConfig(): NgDbHelperModuleConfig {
 *      const connectorConfig = new CordovaSqliteConnectorConfiguration();
 *      // configure db name on device
 *      connectorConfig.dbName = app.sqlite;
 *      // add config to connector
 *      const connector = MixedCordovaSqliteWebsqlConnector(connectorConfig);
 *      // create module config
 *      const config = new NgDbHelperModuleConfig();
 *      config.queryConnector = connector;
 *      config.modelMigration = connector;
 *      config.version = '1';
 *  }
 *
 *  @NgModule({
 *      imports: [
 *          NgDbHelperModule.forRoot(getConfig());
 *      ],
 *      declarations: [],
 *      exports: []
 *  })
 *  export class AwesomeModule {
 *
 *  }
 * ```
 *
 * @author  Olivier Margarit
 * @since   0.1
 */
@NgModule({
    imports: [],
    declarations: [],
    exports: []
})
export class NgDbHelperModule {
    /**
     * @public
     * @static
     * @method forRoot add module configuration
     *
     * @param config {@link NgDbHelperModuleConfigurator} to configure the module
     *
     * @return ModuleWithProviders
     */
    public static forRoot(getConfiguration: () => NgDbHelperModuleConfig): ModuleWithProviders {
        return {
            ngModule: NgDbHelperModule,
            providers: [
                {
                    provide: NgDbHelperModuleConfig,
                    useFactory: getConfiguration
                }
            ]
        };
    }

    /**
     * @public
     * @constructor must be called with the configuration, it is a mandatory requirment
     *
     * @param config {@link NgDbHelperModuleConfigurator} to configure the module
     */
    public constructor(config: NgDbHelperModuleConfig) {
        QueryManager.init(config);
    }
}
