/**
 * 基础响应控制器
 *
 * @author : sunkeysun
 */
import React from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { useStaticRendering } from 'mobx-react'
import IClass from '../support/base/IClass'
import HTML from '../shared/common/components/page/HTML'

useStaticRendering(true)

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
        let jsonData = data
        const result = JSON.stringify(jsonData)

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

    redirect(url) {
        this._ctx.redirect(url)
        return this
    }

    render404(detail='') {
        return this.renderError(404, detail)
    }

    render500(detail='') {
        return this.renderError(500, detail)
    }

    render403(detail='') {
        return this.renderError(403, detail)
    }

    renderError(code, detail='') {
        if (this._ctx.res.headersSent) {
            return false
        }

        if (this._ctx.iRequest.isAsync()) {
            return this.jsonError(code, detail)
        }

        const appPath = `${app().sharedPath}/app/common`
        const appName = 'common'

        const initialState = {
            error: {
                code: code === 'core' ? 500 : code,
                detail: _.isString(detail) ? detail : '',
            },
        }

        let errContent = 'Internal Server Error'

        try {
            errContent = this._render({ appPath, appName, initialState, autoSend: true })
        } catch(e) {
            app().logger.error(e)
        }

        if (code === 'core') {
            this._ctx.res.statusCode = 500
            return this._ctx.res.end(errContent)
        } else {
            return this.status(code).send(errContent)
        }
    }

    jsonError(code, e) {
        this.header('content-type', 'application/javascript')

        const jsonObj = {}
        let jsonData = ''
        jsonObj.code = _.get(e, 'code', '[[RUNTIME]]')
        jsonObj.message = e.message

        if (!_.isEmpty(jsonObj)) {
            jsonData = JSON.stringify(jsonObj)
        }

        if (code === 'core') {
            this._ctx.res.statusCode = 500
            return this._ctx.res.end(jsonData)
        } else {
            return this.status(code).send(jsonData)
        }
    }

    _render({ appPath, appName='', initialState={}, autoSend=true }) {
        const appConfig = app().config('app')

        let appContent = ''
        let appState = initialState

        if (!!appConfig.ssr) {
            const RootComponent = require('../shared/app/ServerRoot').default
            const App = require(`${appPath}/App`).default
            const Store = require(`${appPath}/store`).default

            const routing = {
                location: {
                    pathname: this._ctx.request.path,
                }
            }

            const webpackConfig = require(`${app().webpackPath}/config/common`).default
            const buildMode = process.env.NODE_ENV === 'local' ? 'debug' : 'release'
            const config = webpackConfig[buildMode]

            let store = new Store(initialState)
            store = { ...store, routing }

            const rootState = {
                App: App,
                store: store,
                context: {},
                location: this._ctx.request.path,
            }

            appContent = renderToString(<RootComponent { ...rootState } />)
        }

        const props = {
            ssr: appConfig.ssr,
            title: _.get(this.locals, 'PAGE_TITLE', ''),
            keywords: _.get(this.locals, 'PAGE_KEYWORDS', ''),
            description: _.get(this.locals, 'PAGE_DESCRIPTION', ''),
            jsList: _.get(this.locals, 'JS_LIST', []),
            cssList: _.get(this.locals, 'CSS_LIST', []),
            initialState: initialState,
            nodeEnv: process.env.NODE_ENV,
            appName: appName,
            appContent: appContent,
            sharedPath: app().sharedPath,
            noHash: appConfig.noHash,
            webHost: appConfig.webHost,
        }

        let htmlContent = renderToStaticMarkup(<HTML { ...props } />)

        if (!autoSend) {
            return htmlContent
        }

        htmlContent = `<!DOCTYPE html>${htmlContent}`

        return this.send(htmlContent)
    }

    renderApp(appName, initialState={}) {
        this.header('content-type', 'text/html')

        const appPath = `${app().sharedPath}/app/${appName}`

        return this._render({ appPath, appName, initialState })
    }
}
