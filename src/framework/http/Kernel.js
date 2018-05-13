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
import RequestLogMiddleware from './middlewares/RequestLog'
import RequestTimeoutMiddleware from './middlewares/RequestTimeout'
import IRequestResponseMiddleware from './middlewares/IRequestResponse'
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

    __events = {
        'process-uncaughtException': Symbol('process-uncaughtException'),
        'process-unhandledRejection': Symbol('process-unhandledRejection'),
        'process-SIGINT': Symbol('process-SIGINT'),
        'process-SIGUSR1': Symbol('process-SIGUSR1'),
        'process-SIGUSR2': Symbol('process-SIGUSR2'),
        'process-SIGTERM': Symbol('process-SIGTERM'),
        'process-warning': Symbol('process-warning'),
        'process-exit': Symbol('process-exit'),
        'app-error': Symbol('app-error'),
        'app-timeout': Symbol('app-timeout'),
        'app-listening': Symbol('app-listening'),
        'session-error': Symbol('session-error'),
        'redis-connect': Symbol('redis-connect'),
        'redis-ready': Symbol('redis-ready'),
        'redis-error': Symbol('redis-error'),
        'database-connect': Symbol('database-connect'),
        'database-error': Symbol('database-error'),
        'request-error': Symbol('request-error'),
        'route-error': Symbol('route-error'),
    }

    isBrowser = false

    constructor(basePath) {
        super()

        this.__basePath = basePath
        this.__initEnv()
        this.__registerGlobal()
        this.__registerBaseProvider()
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

    event(eventName) {
        if (!this.__events[eventName]) {
            throw new IException(`event ${eventName} not supported, you can use app().events get event list`)
        }

        return this.__events[eventName]
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
        this.__coreApp.use(RequestTimeoutMiddleware)
        this.__coreApp.use(IRequestResponseMiddleware)
        this.__coreApp.use(coreBody({ multipart: true }))
        this.__coreApp.use(RequestLogMiddleware)
        this.__initSessionMiddleware()
        this.__initRoutingMiddleware()
    }

    __registerBaseProvider() {
        this.__registerLogProvider()
        this.__registerRedisProvider()
        this.__registerDatabaseProvider()
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

    __initRoutingMiddleware() {
        const routes = ( new RoutingProvider() ).register()
        this.__coreApp.use(routes)
    }

    __initSessionMiddleware() {
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

        this._registerGlobalEvents()
        this.__registerSystemEvents()
    }

    _registerGlobalEvents() {
        console.log(`Inventor app() support events : ${JSON.stringify(_.keys(this.__events))}`)
    }

    __registerSystemEvents() {
        process.on('uncaughtException', (e) => {
            const event = app().event('process-uncaughtException')
            if (app().listenerCount(event) > 0) {
                return app().emit(event, e)
            }

            if (app().logger) {
                app().logger.error(e, 'process')
            } else {
                console.log(e)
            }

            process.exit(1)
        })

        process.on('unhandledRejection', (reason, promise) => {
            const event = app().event('process-unhandledRejection')
            if (app().listenerCount(event) > 0) {
                return app().emit(event, reason, promise)
            }

            app().emit(event, reason, promise)
            app().logger.error(reason, 'process')
        })

        process.on('SIGINT', () => {
            const event = app().event('process-SIGINT')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            app().logger.error('SIGINT', 'process')
            process.exit(0)
        })

        process.on('SIGUSR1', () => {
            const event = app().event('process-SIGUSR1')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            app().logger.error('SIGUSR1', 'process')
            process.exit(0)
        })

        process.on('SIGUSR2', () => {
            const event = app().event('process-SIGUSR2')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            app().logger.error('SIGUSR2', 'process')
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            const event = app().event('process-SIGTERM')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            app().logger.error('SIGTERM', 'process')
            process.exit(0)
        })

        process.on('warning', () => {
            const event = app().event('process-warning')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            app().logger.error('warning', 'process')
        })

        process.on('exit', (e) => {
            const event = app().event('process-exit')
            if (app().listenerCount(event) > 0) {
                return app().emit(event)
            }

            if (app().logger) {
                app().logger.error('exit', 'process')
            } else {
                console.log('exit')
            }
        })
    }

    run() {
        if (!!this.__booted) {
            throw new IException('Http kernel can\'t be rebooted.')
        }

        const { host='', port } = this.__appConfig.server

        this.__coreApp.onerror = (e, ctx) => {
            const event = app().event('app-error')
            if (app().listenerCount(event) > 0) {
                return app().emit(event, e, ctx)
            }

            app().logger.error(e, 'app')

            return ctx.iResponse.render500(e)
        }

        let server = this.__coreApp

        if (host) {
            server = this.__coreApp.listen(port, host)
        } else {
            server = this.__coreApp.listen(port)
        }

        server.on('listening', () => {
            app().logger.info(`Inventor server listening on ${host}:${port}`, 'app')
            app().emit(app().event('app-listening'), this.__appConfig.server)
        })

        this.__booted = true
    }
}
