/**
 * 基础响应控制器
 *
 * @author : sunkeysun
 */
import React from 'react'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { createStore, applyMiddleware, combineReducers } from 'redux'

import IClass from '../support/base/IClass'
import HTML from '../shared/common/components/page/HTML'

export default class Response extends IClass {
    _ctx = null

    _locals = {}

    get locals() {
        return this._locals
    }

    constructor(ctx) {
        super()

        this._ctx = ctx
    }

    header(field, value) {
        this._ctx.response.set(field, value)
        return this
    }

    json(data) {
        this.header('content-type', 'application/json')

        let JsonData = data
        if (!!_.isError(data)) {
            JsonData = {
                code: -1,
                msg: data.message,
            }
        }

        const result = JSON.stringify(JsonData)

        return this.send(result)
    }

    jsonp(data, callback='') {
        this.header('content-type', 'application/javascript')

        const cb = _.get(this._ctx.request.query, 'callback', callback)
        const jsonData = JSON.stringify(data)
        const result = `${cb}(${jsonData})`

        return this.send(result)
    }

    send(data='') {
        this._ctx.response.body = data
        return this
    }

    status(code) {
        this._ctx.response.status = code
        return this
    }

    cookie(name, value, options={}) {
        this._ctx.cookies.set(name, value, options)
        return this
    }

    render404() {
        return this.renderError(404)
    }

    render500() {
        return this.renderError(500)
    }

    render403() {
        return this.renderError(403)
    }

    renderError(code) {
        const appPath = `${app().sharedPath}/apps/common`
        const appName = 'common'

        const initialState = {
            error: { code },
        }

        try {
            return this._render({ appPath, appName, initialState })
        } catch(e) {
            app().logger.error(e)
            return this.status(code).send('')
        }
    }

    _render({ appPath, appName='', initialState={} }) {
        const appConfig = app().config('app')

        let appContent = ''
        let appState = initialState

        if (!!appConfig.ssr) {
            const RootComponent = require('../shared/app/ServerRoot').default
            const App = require(`${appPath}/App`).default
            const reducers = require(`${appPath}/redux`).default

            const routing = {
                location: {
                    pathname: this._ctx.request.path,
                }
            }

            const webpackConfig = require(`${app().webpackPath}/config`).default
            const buildMode = process.env.NODE_ENV === 'local' ? 'debug' : 'release'
            const config = webpackConfig[buildMode]

            const variables = {
                staticPath: config.publicPath,
            }

            const rootReducer = combineReducers({
                ...reducers,
                variables: (state=variables) => state,
                routing: (state=routing) => state,
            })

            const store = createStore(rootReducer, initialState)

            const rootState = {
                App: App,
                store: store,
                context: {},
                location: this._ctx.request.path,
            }

            appContent = renderToString(<RootComponent { ...rootState } />)
            appState = store.getState()
        }

        const webpackManifest = require(`${app().sharedPath}/__manifest.json`)

        const props = {
            ssr: appConfig.ssr,
            title: _.get(this.locals, 'PAGE_TITLE', ''),
            keywords: _.get(this.locals, 'PAGE_KEYWORDS', ''),
            description: _.get(this.locals, 'PAGE_DESCRIPTION', ''),
            initialState: appState,
            nodeEnv: process.env.NODE_ENV,
            appName: appName,
            appContent: appContent,
            sharedPath: app().sharedPath,
            webpackManifest: webpackManifest,
        }
        return this.send(renderToStaticMarkup(<HTML { ...props } />))
    }

    renderApp(appName, initialState={}) {
        this.header('content-type', 'text/html')

        const appPath = `${app().sharedPath}/apps/${appName}`

        return this._render({ appPath, appName, initialState })
    }
}
