/**
 * Http 核心类
 *
 * @author : sunkeysun
 */

import EventEmitter from 'events'
import lodash from 'lodash'
import moment from 'moment'
import CoreApp from 'koa'
import coreBody from 'koa-body'

import IClass from '../support/base/IClass'
import IException from '../support/base/IException'
import LogProvider from '../log/LogProvider'
import RedisProvider from '../redis/RedisProvider'
import DatabaseProvider from '../database/DatabaseProvider'
import SessionProvider from '../session/SessionProvider'
import RoutingProvider from '../routing/RoutingProvider'
import RequestProvider from '../request/RequestProvider'
import RequestLogMiddleware from './middleware/RequestLogMiddleware'
import RouteMiddleware from './middleware/RouteMiddleware'
import { config } from '../support/helpers'
import version from '../version'

export default class Kernel extends EventEmitter {
    __coreApp = new CoreApp()
    __basePath = ''
    __logger = null
    __redis = null
    __db = null
    __session = null
    __env = ''
    __singletons = {}
    __booted = false

    __envs = [ 'local', 'development', 'test', 'production' ]

    __appConfig = {}

    isBrowser = false

    constructor(basePath) {
        super()

        this.__basePath = basePath
        this.__registerGlobal()
        this.__initEnv()
        this.__initApp()
        this.__initBaseMiddleware()
        this.__registerBaseProvider()
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

    get db() {
        return this.__db
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

    sharedConfig(configName) {
        const configPath = `${this.sharedPath}/common/config/${configName}`
        let config = {}

        try {
            config = require(configPath).default
        } catch(e) {}

        return config
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
        const env = process.env.NODE_ENV

        if (!~this.__envs.indexOf(env)) {
            console.error(`NODE__ENV not in ${JSON.stringify(this.__envs)}`)
            throw new IException({ message: `NODE__ENV not in ${JSON.stringify(this.__envs)}` })
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
        this.__registerDatabaseProvider()
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

    __registerDatabaseProvider() {
        this.__db = ( new DatabaseProvider() ).register()
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

        this.__registerGlobalEvents()
        this._registerGlobalEvents()
    }

    _registerGlobalEvents() {
        const availableEvents = [
            'process-uncaughtException',
            'process-unhandledRejection',
            'process-SIGINT',
            'process-SIGUSR1',
            'process-SIGUSR2',
            'process-SIGTERM',
            'process-warning',
            'app-error',
            'app-listening',
            'process-exit',
            'redis-connect',
            'redis-ready',
            'redis-error',
            'database-connect',
            'database-error',
        ]

        console.log(`Inventor app() support events : ${JSON.stringify(availableEvents)}`)
    }

    __registerGlobalEvents() {
        process.on('uncaughtException', (e) => {
            app().logger.error(e, 'process')
            app().emit('process-uncaughtException', e)
            process.exit(1)
        })

        process.on('unhandledRejection', (reason, promise) => {
            app().logger.error(reason, 'process')
            app().emit('process-unhandledRejection', reason, promise)
        })

        process.on('SIGINT', () => {
            app().logger.error('SIGINT', 'process')
            app().emit('process-SIGINT')
            process.exit(0)
        })

        process.on('SIGUSR1', () => {
            app().logger.error('SIGUSR1', 'process')
            app().emit('process-SIGUSR1')
            process.exit(0)
        })

        process.on('SIGUSR2', () => {
            app().logger.error('SIGUSR2', 'process')
            app().emit('process-SIGUSR2')
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            app().logger.error('SIGTERM', 'process')
            app().emit('process-SIGTERM')
            process.exit(0)
        })

        process.on('warning', () => {
            app().logger.error('warning', 'process')
            app().emit('process-warning')
        })

        process.on('exit', () => {
            app().logger.error('exit', 'process')
            app().emit('process-exit')
        })
    }

    run() {
        if (!!this.__booted) {
            throw new IException('Http kernel can\'t be rebooted.')
        }

        const { host='', port } = this.__appConfig.server

        let server = this.__coreApp

        if (host) {
            server = this.__coreApp.listen(port, host)
        } else {
            server = this.__coreApp.listen(port)
        }

        this.__coreApp.on('error', (e) => {
            app().logger.error(e, 'app')
            app().emit('app-error', e)
        })

        server.on('listening', () => {
            app().logger.info(`Inventor server listening on ${host}:${port}`, 'app')
            app().emit('app-listening')
        })

        this.__booted = true
    }
}
