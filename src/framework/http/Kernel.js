/**
 * Http 核心类
 *
 * @author : sunkeysun
 */

import EventEmitter from 'events'
import CoreApp from 'koa'
import coreBody from 'koa-body'
import coreStatic from 'koa-static-server'

import './superGlobals'

import LogProvider from '../log/LogProvider'
import RedisProvider from '../redis/RedisProvider'
import DatabaseProvider from '../database/DatabaseProvider'
import SessionProvider from '../session/SessionProvider'
import RoutingProvider from '../routing/RoutingProvider'
import RequestProvider from '../request/RequestProvider'
import asyncContextMiddleware from './middlewares/asyncContext'
import requestLogMiddleware from './middlewares/requestLog'
import requestTimeoutMiddleware from './middlewares/requestTimeout'
import requestResponseMiddleware from './middlewares/requestResponse'
import seqIdMiddleware from './middlewares/seqId'
import { config } from '../support/helpers'
import version from '../version'
import { normalizeMiddleware } from '../support/helpers'

export default class Kernel extends EventEmitter {
    _coreApp = new CoreApp()
    _basePath = ''
    _logger = null
    _redis = null
    _db = null
    _session = null
    _viewEngine = null
    _env = ''
    _singletons = {}
    _booted = false

    _envs = [ 'local', 'development', 'test', 'production' ]
    _viewEngines = [
        'react-redux',
    ]

    _appConfig = {}

    _middlewares = []

    _events = {
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

        this._basePath = basePath
        this._initEnv()
        this._registerGlobal()
        this._initCoreApp()
        this._registerBaseProvider()
        this._initBaseMiddleware()
        this._initViewEngine()
    }

    get version() {
        return `${version.name}/${version.version}`
    }

    get basePath() {
        return this._basePath
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
        return this._logger
    }

    get redis() {
        return this._redis
    }

    get db() {
        return this._db
    }

    get request() {
        return this._request
    }

    get viewEngine() {
        return this._viewEngine
    }

    get env() {
        return this._env
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
        if (this._singletons[classPath]) {
            return this._singletons[classPath]
        }

        const Class = require(classPath).default
        const instance = new Class(...args)
        this._singletons[classPath] = instance

        return instance
    }

    event(eventName) {
        if (!this._events[eventName]) {
            throw new Error(`event ${eventName} not supported, you can use app().events get event list`)
        }

        return this._events[eventName]
    }

    get events() {
        return _.keys(this._events)
    }

    _initEnv() {
        const env = process.env.NODE_ENV

        if (!~this._envs.indexOf(env)) {
            console.error(`NODE_ENV not in ${JSON.stringify(this._envs)}`)
            throw new Error({ message: `NODE_ENV not in ${JSON.stringify(this._envs)}` })
        }

        this._env = env
    }

    _initCoreApp() {
        this._appConfig = this.config('app')
        this._coreApp.keys = this.config('app').keys
    }

    _initBaseMiddleware() {
        const staticConfig = app().config('app').static
        const middlewareConfig = app().config('app').coreMiddleware
        const bodyConfig = _.get(middlewareConfig, 'body', { multipart: true })

        this._coreApp.use(asyncContextMiddleware)
        this._coreApp.use(requestTimeoutMiddleware)
        this._coreApp.use(requestResponseMiddleware)
        this._coreApp.use(requestLogMiddleware)
        this._coreApp.use(seqIdMiddleware)

        if (staticConfig) {
            this._coreApp.use(coreStatic(staticConfig))
        }
        this._coreApp.use(coreBody(bodyConfig))

        this._initSessionMiddleware()
        this._initCustomMiddlewares()
        this._initRoutingMiddleware()
    }

    _initViewEngine() {
        const viewConfig = app().config('app').view
        if (!_.get(viewConfig, 'engine')) {
            console.warn('view engine not found!')
            return false
        } else if (!~this._viewEngines.indexOf(viewConfig.engine)) {
            console.warn(`view engine only support '${JSON.stringify(this._viewEngines)}'`)
            return false
        }

        const modulesConfig = require(`${app().webpackPath}/config/modules`)

        const ViewEngine = require(`inventor-view-${viewConfig.engine}/server`).default
        this._viewEngine = new ViewEngine({
            appPath: `${app().sharedPath}/${modulesConfig.app.ename}`,
            commonPath: `${app().sharedPath}/${modulesConfig.common.ename}`,
            vendorPath: `${app().sharedPath}/${modulesConfig.vendor.ename}`,
        })
    }

    _initRoutingMiddleware() {
        const routes = ( new RoutingProvider() ).register()
        this._coreApp.use(routes)
    }

    _initSessionMiddleware() {
        const session = ( new SessionProvider() ).register()
        this._coreApp.use(session(this._coreApp))
    }

    _initCustomMiddlewares() {
        if (!this._middlewares.length) {
            return false
        }

        _.each(this._middlewares, (Middleware) => {
            this._coreApp.use(normalizeMiddleware(Middleware.handle.bind(Middleware)))
        })
    }

    _registerBaseProvider() {
        this._registerLogProvider()
        this._registerRedisProvider()
        this._registerDatabaseProvider()
        this._registerRequestProvider()
    }

    _registerLogProvider() {
        this._logger = ( new LogProvider() ).register()
    }

    _registerRedisProvider() {
        this._redis = ( new RedisProvider() ).register()
    }

    _registerDatabaseProvider() {
        this._db = ( new DatabaseProvider() ).register()
    }

    _registerRequestProvider() {
        const requestConfig = _.defaults(app().config('app').request, { ua: this.version })
        this._request = ( new RequestProvider() ).register(requestConfig)
    }

    _registerGlobal() {
        global.app = () => this
        const globals = app().config('app').globals || {}

        _.extend(global, {
            ...globals,
            app: () => this,
        })

        this._registerGlobalEvents()
        this._registerSystemEvents()
    }

    _registerGlobalEvents() {
        console.log(`Inventor app() support events : ${JSON.stringify(_.keys(this._events))}`)
    }

    _registerSystemEvents() {
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
        if (!!this._booted) {
            throw new Error('Http kernel can\'t be rebooted.')
        }

        const { host='', port } = this._appConfig.server

        this._coreApp.onerror = (e, ctx) => {
            const event = app().event('app-error')
            if (app().listenerCount(event) > 0) {
                return app().emit(event, e, ctx.iRequest, ctx.iResponse)
            }

            app().logger.error(e, 'app')

            return ctx.iResponse.renderError('core', e)
        }

        let server = this._coreApp

        if (host) {
            server = this._coreApp.listen(port, host)
        } else {
            server = this._coreApp.listen(port)
        }

        server.on('listening', () => {
            app().logger.info(`Inventor server listening on ${host}:${port}`, 'app')
            app().emit(app().event('app-listening'), this._appConfig.server)
        })

        this._booted = true
    }
}
