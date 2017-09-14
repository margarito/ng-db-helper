import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/ng-db-helper.umd.js',
    sourceMap: false,
    format: 'umd',
    moduleName: 'NgDbHelperModule',
    globals: {
        '@angular/core': 'ng.core',
        'ts-db-helper': 'ts-db-helper',
        'ts-db-helper/src/core/managers/query-manager': 'QueryManager',
        'rxjs/Observable': 'Rx',
        'rxjs/Observer': 'Rx',
        'rxjs/Subject': 'Rx',
        'rxjs/add/operator/combineLatest': 'Rx.Observable.prototype',
        'rxjs/add/operator/map': 'Rx.Observable.prototype',
        'rxjs/add/operator/share': 'Rx.Observable.prototype',
        'rxjs/add/observable/concat': 'Rx.Observable.prototype'
    },
    external: [
        '@angular/core',
        'rxjs/Observable',
        'rxjs/Observer',
        'rxjs/Subject',
        'rxjs/add/observable/combineLatest',
        'rxjs/add/operator/map',
        'rxjs/add/operator/share',
        'rxjs/add/observable/concat'
    ],
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs()
    ]
};