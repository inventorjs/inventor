/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import EventEmitter from 'eventemitter3'

import RequestProvider from '../request/RequestProvider'
import version from '../version'

window.global = window

lodash.extend(global, {
    moment,
    _: lodash,
})

export default class Kernel extends EventEmitter {
    _request = null
    _logger = console

    _appConfig = {}
    _appData = {}

    _events = {
        'request-error': Symbol('request-error'),
    }

    isBrowser = true

    constructor({ appConfig, ...appData }) {
        super()
        this._registerGlobal()

        this._appConfig = appConfig
        this._appData = appData
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
        this._request = (new RequestProvider()).register(this._appConfig.request)
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
