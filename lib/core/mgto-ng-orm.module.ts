import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {QueryEngine} from './managers/query-engine';
import {ModelManager} from './managers/model-manager';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: []
})
export class MgtoNgOrm {
  private dbName = 'database.db';
    private sourceDbName = 'database.db';
    private sourceDbPath = 'www/assets/';
    private src = '';
    private DB_VERSION = '1.0.13';
    private dbInfo = {
        name: this.dbName,
        location: 'default'
    };

    private set db(value) {
        QueryEngine.getInstance().db = value;
    }

    private get db() {
        return QueryEngine.getInstance().db;
    }

    constructor() {
        const window = Window;
        document.addEventListener('deviceready', () => this.onDeviceReady());
    }

    private onDeviceReady() {
        this.init();
    }

    private init() {
        if (device.platform === 'browser') {
            if (window.openDatabase) {
                const db = window.openDatabase(this.dbName, '', this.dbName, 10000000, () => { });

                if (db.version !== this.DB_VERSION) {
                    db.changeVersion(db.version, this.DB_VERSION, (t) => {
                        ModelManager.getInstance().createTablesIfNeeded(db).then(() => {
                            const promises: [Promise<any>] = <[Promise<any>]> [];
                            // TODO: insert callbacks
                            // promises.push(ModelManager.getInstance().executeInserts(insertion));
                            Promise.all(promises).then(() => {
                                this.db = db;
                            }, (err) => {
                                console.error(err);
                            });
                        }, (err) => {
                            console.error(err);
                        });
                    });
                } else {
                    this.db = db;
                }
            }
        } else {
            this.src = cordova.file.dataDirectory + this.dbName;
            if (device.platform === 'Android') {
                this.src = cordova.file.applicationStorageDirectory  + 'databases/' + this.dbName;
                console.log('platform is android');
                console.log('src: ' + this.src);
            }

            window.resolveLocalFileSystemURL(this.src, () => {
                this.db = sqlitePlugin.openDatabase(this.dbInfo);
            }, () => {
                this.copyDb(this.dbName);
            });
        }
    }

    private copyDb(dbName) {
        const sourceFileName = cordova.file.applicationDirectory + this.sourceDbPath + this.sourceDbName;
        let targetDirName = cordova.file.dataDirectory;
        if (device.platform === 'Android') {
            targetDirName = cordova.file.applicationStorageDirectory + 'databases/';
            console.log('platform is android');
            console.log('targetDirName: ' + targetDirName);
        }

        return Promise.all([
            new Promise((resolve, reject) => {
                window.resolveLocalFileSystemURL(sourceFileName, resolve, (err) => {
                    console.log(err);
                    reject(err);
                });
            }),
            new Promise((resolve, reject) => {
                window.resolveLocalFileSystemURL(targetDirName, resolve, (err) => {
                    if (device.platform === 'Android') {
                        window.resolveLocalFileSystemURL(cordova.file.applicationStorageDirectory, (dir) => {
                            (dir as DirectoryEntry).getDirectory('databases', {create : true}, resolve, reject);
                        }, reject);
                    } else {
                        console.log(err);
                        reject(err);
                    }
                });
            })
        ]).then((files: [any]) => {
            const sourceFile = files[0];
            const targetDir = files[1];
            return new Promise((resolve, reject) => {
                targetDir.getFile(dbName, {}, resolve, reject);
            }).then(() => {
                console.log('file already copied');
            }).catch(() => {
                console.log('file doesn\'t exist, copying it');
                return new Promise((resolve, reject) => {
                    sourceFile.copyTo(targetDir, dbName, resolve, reject);
                }).then(() => {
                    console.log('database file copied');
                    this.db = sqlitePlugin.openDatabase(this.dbInfo);
                });
            });
        }, (err) => {
            console.log(err);
        });
    }
}
