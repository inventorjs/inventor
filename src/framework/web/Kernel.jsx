/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import EventEmitter from 'eventemitter3'

global = typeof window !== undefined && window || this
import './superGlobals'

import RequestProvider from '../request/RequestProvider'
import version from '../version'

export default class Kernel extends EventEmitter {
    _request = null
    _logger = console

    _appConfig = {}

    _events = {
        'request-error': Symbol('request-error'),
    }

    isBrowser = true

    constructor({ appConfig }) {
        super()
        this._registerGlobal()

        this._appConfig = appConfig
    }

    get version() {
        return `${version.name}/${version.version}`
    }

    get request() {
        return this._request
    }

    get logger() {
        return this._logger
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

    _registerBaseProviders() {
        const requestConfig = _.get(this._appConfig, 'request', {})
        this._request = (new RequestProvider()).register(requestConfig)
    }

    _registerGlobal() {
        lodash.extend(global, {
            app: () => this,
        })
    }

    run(render) {
        this._registerBaseProviders()
        render()
    }
}
