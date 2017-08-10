// Type definitions for Apache Cordova
// Project: http://cordova.apache.org
// Definitions by: Microsoft Open Technologies Inc <http://msopentech.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
//
// Copyright (c) Microsoft Open Technologies Inc
// Licensed under the MIT license.



interface Cordova {
    /** Gets the operating system name. */
    platformId: string;
    /** Namespace for Cordova plugin functionality */
    plugins: CordovaPlugins;
    /** Gets Cordova framework version */
    version: string;
    /** Invokes native functionality by specifying corresponding service name, action and optional parameters.
     * @param success A success callback function.
     * @param fail An error callback function.
     * @param service The service name to call on the native side (corresponds to a native class).
     * @param action The action name to call on the native side (generally corresponds to the native class method).
     * @param args An array of arguments to pass into the native environment.
     */
    exec(success: (data: any) => any, fail: (err: any) => any, service: string, action: string, args?: any[]): void;
    /** Defines custom logic as a Cordova module. Other modules can later access it using module name provided. */
    define(moduleName: string, factory: (require: any, exports: any, module: any) => any): void;
    /** Access a Cordova module by name. */
    require(moduleName: string): any;
}

interface CordovaPlugins {}

interface Window {
  cordova: Cordova;
}

// cordova/argscheck module
interface ArgsCheck {
    enableChecks: boolean;
    checkArgs(argsSpec: string, functionName: string, args: any[], callee?: any): void;
    getValue(value?: any, defaultValue?: any): any;
}

// cordova/urlutil module
interface UrlUtil {
    makeAbsolute(url: string): string;
}

/** Apache Cordova instance */
declare var cordova: Cordova;

declare module 'cordova' {
    export = cordova;
}
