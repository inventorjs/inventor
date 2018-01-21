/**
 * 基础响应控制器
 *
 * @author : sunkeysun
 */
import React from 'react'
import { routerReducer, routerMiddleware } from 'react-router-redux'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { createStore, applyMiddleware } from 'redux'
import promiseMiddleware from 'redux-promise-middleware'

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

    renderError(code, preloadedState={}) {
        const appPath = `${app().sharedPath}/common/errors/${code}`
        const appName = 'common'

        try {
            const App = require(appPath)
            return this._render({ appPath, appName, preloadedState })
        } catch(e) {
            return this.status(code).send('')
        }
    }

    _renderAppContent(appPath, initialState={}) {
        const RootComponent = require('../shared/app/ServerRoot').default
        const App = require(appPath).default
        const rootReducer = combineReducers({
            ...initialState,
            router: routerReducer,
        })
        const middleware = applyMiddleware(
                                promiseMiddleware(),
                            )

        const store = createStore(rootReducer, initialState, middleware)

        const rootState = {
            store: store,
            context: {},
            location: this._ctx.request.path,
        }

        return renderToString(<RootComponent { ...rootState } />)
    }

    _render({ appPath, appName='', initialState={} }) {
        const appConfig = app().config('app')

        let appContent = ''
        if (!!appConfig.ssr) {
            appContent = this._renderAppContent(appPath, initialState)
        }

        const props = {
            ssr: appConfig.ssr,
            title: _.get(this.locals, 'PAGE_TITLE', ''),
            keywords: _.get(this.locals, 'PAGE_KEYWORDS', ''),
            description: _.get(this.locals, 'PAGE_DESCRIPTION', ''),
            initialState: initialState,
            appName: appName,
            appContent: appContent,
            sharedPath: app().sharedPath,
        }
        return this.send(renderToStaticMarkup(<HTML { ...props } />))
    }

    renderApp(appName, initialState={}) {
        this.header('content-type', 'text/html')

        const appPath = `${app().sharedPath}/apps/${appName}`

        return this._render({ appPath: `${appPath}/App`, appName, initialState })
    }
}
