export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/ng-db-helper.umd.js',
    sourceMap: false,
    format: 'umd',
    moduleName: 'NgDbHelperModule',
    globals: {
        '@angular/core': 'ng.core',
        'rxjs/Observable': 'Rx',
        'rxjs/Observer': 'Rx',
        'rxjs/add/operator/combineLatest': 'Rx.Observable.prototype'
    }
}