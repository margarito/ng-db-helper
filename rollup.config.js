export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/ng-db-helper.umd.js',
    sourceMap: false,
    format: 'umd',
    moduleName: 'NgDbHelperModule',
    globals: {
        'ts-db-helper': 'TsDbHelper',
        '@angular/core': 'ng.core',
        'rxjs/Observable': 'Rx',
        'rxjs/Observer': 'Rx',
        'rxjs/Subject': 'Rx',
        'rxjs/add/operator/combineLatest': 'Rx.Observable.prototype',
        'rxjs/add/operator/map': 'Rx.Observable.prototype',
        'rxjs/add/operator/share': 'Rx.Observable.prototype',
        'rxjs/add/observable/concat': 'Rx.Observable.prototype'
    },
    external: [
        'ts-db-helper',
        '@angular/core',
        'rxjs/Observable',
        'rxjs/Observer',
        'rxjs/Subject',
        'rxjs/add/observable/combineLatest',
        'rxjs/add/operator/map',
        'rxjs/add/operator/share',
        'rxjs/add/observable/concat'
    ]
};