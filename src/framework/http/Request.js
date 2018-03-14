/**
 * 基础请求类
 *
 * @author : sunkeysun
 */

import IClass from '../support/base/IClass'
import { extendObject } from '../shared/common/modules/utils'

export default class Request extends IClass {
    _ctx = null
    _route = null
    _locals = {}

    constructor(ctx) {
        super()

        this._ctx = ctx
    }

    get locals() {
        return this._locals
    }

    get route() {
        return this._route
    }

    set route(route) {
        this._route = route
    }

    get session() {
        return this._ctx.session
    }

    get params() {
        return this._ctx.params
    }

    get ip() {
        return this._ctx.request.ip
    }

    get ips() {
        return this._ctx.request.ips
    }

    get originalUrl() {
        return this._ctx.request.originalUrl
    }

    get href() {
        return this._ctx.request.href
    }

    get type() {
        return this._ctx.request.type
    }

    get charset() {
        return this._ctx.request.charset
    }

    get host() {
        return this._ctx.request.host
    }

    get hostname() {
        return this._ctx.request.hostname
    }

    get path() {
        return this._ctx.request.path
    }

    get protocol() {
        return this._ctx.request.protocol
    }

    get method() {
        return this._ctx.request.method
    }

    get headers() {
        return this._ctx.request.headers
    }

    get cookies() {
        return this._ctx.cookies
    }

    get body() {
        return this._ctx.request.body
    }

    get query() {
        return this._ctx.request.query
    }

    isAsync() {
        return !!this._ctx.request.headers['x-async-request']
    }
}
