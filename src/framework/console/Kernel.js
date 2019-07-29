/**
 * Console 核心类
 *
 * @author: sunkeysun
 */

import './superGlobals'
import EventEmitter from 'events'
import cronParser from 'cron-parser'

import ScheduleCommand from './commands/Schedule'
import Schedule from './Schedule'

export default class ConsoleKernel extends EventEmitter {
    _basePath = ''
    _logger = null
    _redis = null
    _db = null
    _env = ''
    _singletons = {}
    _booted = false
    _commands = []
    _scheduleCommand = 'inventor:schedule'
    _schedule = null

    _envs = [ 'local', 'development', 'test', 'production' ]

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
        'redis-connect': Symbol('redis-connect'),
        'redis-ready': Symbol('redis-ready'),
        'redis-error': Symbol('redis-error'),
        'database-connect': Symbol('database-connect'),
        'database-error': Symbol('database-error'),
    }

    constructor(basePath) {
        super()

        this._basePath = basePath
        this._initEnv()
        this._registerGlobal()
        this._registerBaseProvider()

        this._schedule = new Schedule()
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

    get appPath() {
        const targetPath = `${this.basePath}/server/app`
        return targetPath
    }

    get commandPath() {
        const targetPath = `${this.appPath}/http/commands`
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

    get env() {
        return this._env
    }

    get scheduleCommand() {
        return this._scheduleCommand
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

    async runCommand(command, options={}) {
        let Command = () => {}
        let realOptions = options

        if (command === this._scheduleCommand) {
            Command = ScheduleCommand
            realOptions = {...options, crontabs: this._schedule.crontabs }
        } else {
            modulePath = `${this.commandPath}/${command}`
            Command = require(modulePath).default
        }

        await Command.handle.apply(Command, realOptions)
    }

    _registerSchedule(schedule) {
        console.log('You can schedule some job in schedule function.')
    }

    async run() {
        if (this._booted) {
            throw new Error('Console kernel can\'t be rebooted.')
        }

        this._booted = true

        this._registerSchedule(this._schedule)
        this.runCommand(this._scheduleCommand)
    }
}