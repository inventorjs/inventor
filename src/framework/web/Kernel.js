/**
 * web 应用程序核心
 *
 * @author : sunkeysun
 */

import lodash from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import ReactDom from 'react-dom'
import IException from '../support/base/IException'
import createRoot from '../shared/app/webRoot'
import RequestProvider from '../request/RequestProvider'
import version from '../version'

export default class Kernel {
    _request = null
    _logger = console

    _App = null
    _rootReducer = {}
    _rootSaga = {}

    constructor({ App, rootReducer, rootSaga }) {
        this._App = App
        this._rootReducer = rootReducer
        this._rootSaga = rootSaga

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

        const preloadedState = global.__PRELOADED_STATE__
        const ssr = global.__SSR__

        const App = this._App
        const rootReducer = this._rootReducer
        const rootSaga = this._rootSaga

        const RootComponent = createRoot({ App, rootReducer, rootSaga })

        let render = ReactDom.render
        if (!!ssr) {
            render = ReactDom.hydrate
        }

        return render(<RootComponent { ...preloadedState } />, document.getElementById('__APP__'))
    }
}
