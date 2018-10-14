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
    __request = null
    __logger = console

    __webpackConfig = ''
    __App = null
    __Store = null
    __appConfig = {}

    __events = {
        'request-error': Symbol('request-error'),
    }

    isBrowser = true

    constructor({ webpackConfig, appConfig, App, Store }) {
        super()

        this.__webpackConfig = webpackConfig
        this.__App = App
        this.__Store = Store
        this.__appConfig = appConfig

        this.__registerGlobal()
    }

    get version() {
        return `${version.name}/${version.version}`
    }

    get request() {
        return this.__request
    }

    get logger() {
        return this.__logger
    }

    get appConfig() {
        return this.__appConfig
    }

    event(eventName) {
        if (!this.__events[eventName]) {
            throw new IException(`event ${eventName} not supported, you can use app().events get event list`)
        }

        return this.__events[eventName]
    }

    get events() {
        return _.keys(this.__events)
    }

    __registerBaseProviders() {
        this.__request = (new RequestProvider()).register(this.appConfig.request)
    }

    __registerGlobal() {
        lodash.extend(global, {
            app: () => this,
        })
    }

    run() {
        this.__registerBaseProviders()

        const initialState = global.__INITIAL_STATE__
        const ssr = global.__SSR__
        const nodeEnv = global.__NODE_ENV__
        const App = this.__App

        const buildMode = nodeEnv === 'local' ? 'debug' : 'release'
        const config = this.__webpackConfig[buildMode]

        const browserHistory = createBrowserHistory()
        const routing = new RouterStore()
        const history = syncHistoryWithStore(browserHistory, routing)

        let store = new this.__Store(initialState)

        store = {
            ...store,
            routing,
        }

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
