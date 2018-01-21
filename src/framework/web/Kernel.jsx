/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import ReactDom from 'react-dom'
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

    _App = null
    _reducers = {}

    constructor({ App, reducers }) {
        this._App = App
        this._reducers = reducers

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

    _registerBaseProviders() {
        this._request = (new RequestProvider()).register({ logRequest: false })
    }

    _registerGlobal() {
        window.global = window

        lodash.extend(global, {
            IException,
            moment,
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

        const history = createHistory()

        const App = this._App
        const rootReducer = combineReducers({
            ...this._reducers,
            router: routerReducer,
        })

        const middleware = applyMiddleware(
                                routerMiddleware(history),
                                promiseMiddleware(),
                            )

        const store = createStore(rootReducer, initialState, middleware)

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
