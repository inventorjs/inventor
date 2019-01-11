/**
 * 基础响应控制器
 *
 * @author : sunkeysun
 */
import IClass from '../support/base/IClass'

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
            errContent = this.renderToString({ appName, initialState })
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

    render(...args) {
        const content = this.renderToString(...args)
        return this.send(content)
    }

    renderToString(appName, initialState) {
        const viewConfig = app().config('app').view
        const locals = _.defaults({}, this._locals, viewConfig.config.locals )
        const href = this._ctx.request.href

        const content = app().viewEngine.render({ appName, href, viewConfig: viewConfig.config, initialState, locals })

        return content
    }
}
