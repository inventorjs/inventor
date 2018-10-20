/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router'
import EventEmitter from 'eventemitter3'

import IException from '../support/base/IException'
import RootComponent from '../shared/app/WebRoot'
import RequestProvider from '../request/RequestProvider'
import version from '../version'

window.global = window

lodash.extend(global, {
    IException,
    moment,
    _: lodash,
})

export default class Kernel extends EventEmitter {
    _request = null
    _logger = console

    _webpackConfig = ''
    _App = null
    _Store = null
    _appConfig = {}

    _events = {
        'request-error': Symbol('request-error'),
    }

    isBrowser = true

    constructor({ webpackConfig, appConfig, App, Store }) {
        super()

        this._webpackConfig = webpackConfig
        this._App = App
        this._Store = Store
        this._appConfig = appConfig

        this._registerGlobal()
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

    get appConfig() {
        return this._appConfig
    }

    event(eventName) {
        if (!this._events[eventName]) {
            throw new IException(`event ${eventName} not supported, you can use app().events get event list`)
        }

        return this._events[eventName]
    }

    get events() {
        return _.keys(this._events)
    }

    _registerBaseProviders() {
        this._request = (new RequestProvider()).register(this.appConfig.request)
    }

    _registerGlobal() {
        lodash.extend(global, {
            app: () => this,
        })
    }

    run() {
        this._registerBaseProviders()

        const initialState = global.__INITIAL_STATE__
        const ssr = global.__SSR__
        const nodeEnv = global.__NODE_ENV__
        const App = this._App

        const buildMode = nodeEnv === 'local' ? 'debug' : 'release'
        const config = this._webpackConfig[buildMode]

        const browserHistory = createBrowserHistory()
        const $routing = new RouterStore()
        const history = syncHistoryWithStore(browserHistory, $routing)
        const $constants = {
            PUBLIC_PATH: config.publicPath,
        }

        let store = new this._Store(initialState)
        _.extend(store, { $routing, $constants })

        let render = ReactDom.render
        if (!!ssr) {
            render = ReactDom.hydrate
        }

        const rootState = { store, App, history }

        render(
            <RootComponent { ...rootState } />,
            document.getElementById('__APP__')
        )
    }
}
