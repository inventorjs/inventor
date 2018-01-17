/**
 * Http 核心类
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import CoreApp from 'koa'
import coreBody from 'koa-body'

import IException from '../support/base/IException'
import LogProvider from '../log/LogProvider'
import RedisProvider from '../redis/RedisProvider'
import SessionProvider from '../session/SessionProvider'
import RoutingProvider from '../routing/RoutingProvider'
import RequestProvider from '../request/RequestProvider'
import RequestLogMiddleware from './middleware/RequestLogMiddleware'
import RouteMiddleware from './middleware/RouteMiddleware'
import { config } from '../support/helpers'
import version from '../version'

export default class Kernel {
    _coreApp = new CoreApp()
    _basePath = ''
    _logger = null
    _redis = null
    _session = null
    _env = ''
    _singletons = {}
    _booted = false

    _appConfig = {}

    middlewareMap = {}

    constructor(basePath) {
        this._basePath = basePath

        this._registerGlobal()

        this._initEnv()
        this._initApp()
        this._initBaseMiddleware()
    }

    get version() {
        return `${version.name}/${version.version}`
    }

    get configPath() {
        const targetPath = `${this._basePath}/server/config`
        return targetPath
    }

    get routesPath() {
        const targetPath = `${this._basePath}/server/routes`
        return targetPath
    }

    get vendorPath() {
        const targetPath = `${this._basePath}/server/vendor`
        return targetPath
    }

    get appPath() {
        const targetPath = `${this._basePath}/server/app`
        return targetPath
    }

    get controllerPath() {
        const targetPath = `${this.appPath}/http/controllers`
        return targetPath
    }

    get sharedPath() {
        const targetPath = `${this._basePath}/shared`
        return targetPath
    }

    get serverPath() {
        const targetPath = `${this._basePath}/server`
        return targetPath
    }

    get viewsPath() {
        const targetPath = `${this.serverPath}/views`
        return targetPath
    }

    get modelsPath() {
        const targetPath = `${this.appPath}/models`
        return targetPath
    }

    get servicesPath() {
        const targetPath = `${this.appPath}/services`
        return targetPath
    }

    get logger() {
        return this._logger
    }

    get redis() {
        return this._redis
    }

    get request() {
        return this._request
    }

    get env() {
        return this._env
    }

    config(configName) {
        return config(configName)
    }

    model(modelName) {
        let modelInstance = this.singleton(modelName)
        if (!modelInstance) {
            const modelPath = `${this.modelsPath}/${modelName}`
            const ModelClass = require(modelPath).default
            modelInstance = new ModelClass()
        }

        return modelInstance
    }

    service(serviceName) {
        let serviceInstance = this.singleton(serviceName)
        if (!serviceInstance) {
            const servicePath = `${this.servicesPath}/${serviceName}`
            const ServiceClass = require(servicePath).default
            serviceInstance = new ServiceClass()
        }

        return serviceInstance
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

    singleton(id) {
        if (_.isUndefined(this._singletons[id])) {
            return false
        }

        return this._singletons[id]
    }

    _initEnv() {
        const envs = [ 'local', 'development', 'test', 'production' ]
        const env = process.env.NODE_ENV || 'productions'

        this._env = env
    }

    _initApp() {
        this._appConfig = this.config('app')
        this._coreApp.keys = this.config('app').keys
    }

    _initBaseMiddleware() {
        this._coreApp.use(coreBody())
        this._coreApp.use(RequestLogMiddleware)
        this._coreApp.use(RouteMiddleware)
    }

    _registerBaseProvider() {
        this._registerLogProvider()
        this._registerRedisProvider()
        this._registerSessionProvider()
        this._registerRoutingProvider()
        this._registerRequestProvider()
    }

    _registerLogProvider() {
        this._logger = ( new LogProvider() ).register()
    }

    _registerRedisProvider() {
        this._redis = ( new RedisProvider() ).register()
    }

    _registerRoutingProvider() {
        const routes = ( new RoutingProvider() ).register()
        this._coreApp.use(routes)
    }

    _registerSessionProvider() {
        const session = ( new SessionProvider() ).register()
        this._coreApp.use(session(this._coreApp))
    }

    _registerRequestProvider() {
        this._request = ( new RequestProvider() ) .register()
    }

    _registerGlobal() {
        lodash.extend(global, {
            IException,
            moment,
            _: lodash,
            app: () => {
                return this
            },
        })

        process.on('uncaughtException', (e) => {
            this.logger.error(e)
        })
    }

    run() {
        if (!!this._booted) {
            throw new IException('Http kernel can\'t be rebooted.')
        }
        this._registerBaseProvider()

        const { host, port } = this._appConfig.server

        this._coreApp.listen(port, host)

        this.logger.info(`Inventor server started on ${host}:${port}`)

        this._booted = true
    }
}
