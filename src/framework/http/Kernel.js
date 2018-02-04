/**
 * Http 核心类
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import CoreApp from 'koa'
import coreBody from 'koa-body'

import IClass from '../support/base/IClass'
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

export default class Kernel extends IClass {
    __coreApp = new CoreApp()
    __basePath = ''
    __logger = null
    __redis = null
    __session = null
    __env = ''
    __singletons = {}
    __booted = false

    __appConfig = {}

    constructor(basePath) {
        super()

        this.__basePath = basePath
        this.__registerGlobal()
        this.__initEnv()
        this.__initApp()
        this.__initBaseMiddleware()
    }

    get version() {
        return `${version.name}/${version.version}`
    }

    get basePath() {
        return this.__basePath
    }

    get configPath() {
        const targetPath = `${this.basePath}/server/config`
        return targetPath
    }

    get routesPath() {
        const targetPath = `${this.basePath}/server/routes`
        return targetPath
    }

    get vendorPath() {
        const targetPath = `${this.basePath}/server/vendor`
        return targetPath
    }

    get appPath() {
        const targetPath = `${this.basePath}/server/app`
        return targetPath
    }

    get controllerPath() {
        const targetPath = `${this.appPath}/http/controllers`
        return targetPath
    }

    get sharedPath() {
        const targetPath = `${this.basePath}/shared`
        return targetPath
    }

    get serverPath() {
        const targetPath = `${this.basePath}/server`
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

    get webpackPath() {
        const targetPath = `${this.basePath}/webpack`
        return targetPath
    }

    get logger() {
        return this.__logger
    }

    get redis() {
        return this.__redis
    }

    get request() {
        return this.__request
    }

    get env() {
        return this.__env
    }

    config(configName) {
        return config(configName)
    }

    model(modelName) {
        const classPath = `${this.modelsPath}/${modelName}`
        return this.singleton(classPath)
    }

    service(serviceName) {
        const classPath = `${this.servicesPath}/${serviceName}`
        return this.singleton(classPath)
    }

    singleton(classPath, ...args) {
        if (this.__singletons[classPath]) {
            return this.__singletons[classPath]
        }

        const Class = require(classPath).default
        const instance = new Class(...args)
        this.__singletons[classPath] = instance

        return instance
    }

    __initEnv() {
        const envs = [ 'local', 'development', 'test', 'production' ]
        const env = process.env.NODE_ENV

        if (!~envs.indexOf(env)) {
            console.log(`NODE_ENV not in ${JSON.stringify(envs)}`)
            throw new IException({ message: `NODE_ENV not in ${JSON.stringify(envs)}` })
        }

        this.__env = env
    }

    __initApp() {
        this.__appConfig = this.config('app')
        this.__coreApp.keys = this.config('app').keys
    }

    __initBaseMiddleware() {
        this.__coreApp.use(coreBody({ multipart: true }))
        this.__coreApp.use(RequestLogMiddleware)
        this.__coreApp.use(RouteMiddleware)
    }

    __registerBaseProvider() {
        this.__registerLogProvider()
        this.__registerRedisProvider()
        this.__registerSessionProvider()
        this.__registerRoutingProvider()
        this.__registerRequestProvider()
    }

    __registerLogProvider() {
        this.__logger = ( new LogProvider() ).register()
    }

    __registerRedisProvider() {
        this.__redis = ( new RedisProvider() ).register()
    }

    __registerRoutingProvider() {
        const routes = ( new RoutingProvider() ).register()
        this.__coreApp.use(routes)
    }

    __registerSessionProvider() {
        const session = ( new SessionProvider() ).register()
        this.__coreApp.use(session(this.__coreApp))
    }

    __registerRequestProvider() {
        this.__request = ( new RequestProvider() ).register()
    }

    __registerGlobal() {
        lodash.extend(global, {
            IException,
            moment,
            _: lodash,
            app: () => {
                return this
            },
        })

        process.on('uncaughtException', (e) => {
            console.log(e)
            this.logger.error(e)
        })
    }

    run() {
        if (!!this._booted) {
            throw new IException('Http kernel can\'t be rebooted.')
        }
        this.__registerBaseProvider()

        const { host, port } = this.__appConfig.server

        this.__coreApp.listen(port, host)

        this.logger.info(`Inventor server started on ${host}:${port}`)

        this.__booted = true
    }
}
