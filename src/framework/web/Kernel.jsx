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
        return () => {
            return this._logger
        }
    }

    get appConfig() {
        return this._appConfig
    }

    _registerBaseProviders() {
        const seqHeader = this.appConfig.requestSeqHeader
        const logRequest = false
        const autoUA = true
        this._request = (new RequestProvider()).register({ logRequest, autoUA, seqHeader })
    }

    _registerGlobal() {
        lodash.extend(global, {
            app: () => this,
        })

        global.onerror = (msg, url, line) => {
            console.log(msg)
            console.log(url)
            console.log(line)
        }
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
        const routing = new RouterStore()
        const history = syncHistoryWithStore(browserHistory, routing)

        let store = new this._Store(initialState)

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
