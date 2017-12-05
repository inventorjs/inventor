/**
 * Http 主应用类
 *
 * @author : sunkeysun
 */

import CoreApp from 'koa'

import Singleton from '../Support/Singleton'
import GlobalServiceProvider from '../Global/GlobalServiceProvider'

export default class Applicaiton extends Singleton {
    _coreApp = new CoreApp()
    _basePath = ''
    _logger = null
    _singletons = {}
    _booted = false

    constructor(basePath) {
        super()

        this._basePath = basePath
    }

    get configPath() {
        const targetPath = `${this._basePath}config/`
        return targetPath
    }

    get routesPath() {
        const targetPath = `${this._basePath}routes/`
        return targetPath
    }

    get vendorPath() {
        const targetPath = `${this._basePath}vendor/`
        return targetPath
    }

    get logger() {
        return this._logger
    }

    get cache() {
        return this._cache
    }

    registerSingleton(id, instance) {
        if (!!_.isUndefined(this._singletons[id])) {
            return false
        }

        this._singletons[id] = instance

        return this
    }

    unregisterSingleton(id) {
        if (!_.isUndefined(id)) {
            return false
        }

        _.unset(this._singletons, id)

        return this
    }

    _registerGlobalServiceProvider() {

    }

    _registerBaseServiceProvider() {

    }

    run() {
        if (!!this._booted) {
            throw new IException('Application can\'t rebooted.')
        }

        this._registerBaseServiceProvider()

        this._coreApp.listen(8000)
    }
}
