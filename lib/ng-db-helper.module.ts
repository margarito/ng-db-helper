import { NgDbHelperModuleConfig } from './ng-db-helper-module-config';
import { Class, ModuleWithProviders, NgModule, Optional } from '@angular/core';
import { CoreModule } from './core/core.module';
import { QueryManager } from './core/managers/query-manager';

@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [],
    exports: []
})
export class NgDbHelperModule {
    public static forRoot(config: NgDbHelperModuleConfig): ModuleWithProviders {
        return {
            ngModule: NgDbHelperModule,
            providers: [
                {provide: NgDbHelperModuleConfig, useValue: config }
            ]
        };
    }

    constructor(@Optional() config: NgDbHelperModuleConfig) {
        const instance = QueryManager.init(config);
    }
}
