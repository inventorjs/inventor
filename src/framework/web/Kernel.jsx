/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import { hot } from 'react-hot-loader'
import createHistory from 'history/createBrowserHistory'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import promiseMiddleware from 'redux-promise-middleware'

import IException from '../support/base/IException'
import RootComponent from '../shared/app/WebRoot'
import RequestProvider from '../request/RequestProvider'
import version from '../version'

export default class Kernel {
    _request = null
    _logger = console

    _webpackConfig = ''
    _App = null
    _reducers = {}
    _appConfig = {}

    constructor({ webpackConfig, appConfig, App, reducers }) {
        this._webpackConfig = webpackConfig
        this._App = App
        this._reducers = reducers
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
        window.global = window

        lodash.extend(global, {
            IException,
            moment,
            hotLoad: hot,
            _: lodash,
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

        const history = createHistory()

        const App = this._App

        const buildMode = nodeEnv === 'local' ? 'debug' : 'release'
        const config = this._webpackConfig[buildMode]

        const variables = {
            staticPath: config.publicPath,
        }

        const rootReducer = combineReducers({
            ...this._reducers,
            variables: (state=variables) => state,
            routing: routerReducer,
        })

        const middleware = applyMiddleware(
                                promiseMiddleware()
                            )

        const store = createStore(rootReducer, initialState)

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
