/**
 * 路由类
 *
 * @author : sunkeysun
 */

import IClass from '../support/base/IClass'

export default class Route extends IClass {
    _handler = null
    _path = ''
    _locals = {}
    _middlewares=[]

    get path() {
        return this._path
    }

    get locals() {
        return this._locals
    }

    get middlewares() {
        return this._middlewares
    }

    get handler() {
        return this._handler
    }

    constructor({ path: routePath, handler, middlewares, locals }) {
        super()

        this._path = routePath
        this._handler = handler
        this._middlewares = middlewares
        this._locals = locals

        if (_.isString(handler)) {
            if (!~handler.indexOf('@')) {
                throw new Error(`route handler string must like {controller}@{action}, now is ${handler}`)
            }
            const handlerArr = handler.split('@')
            const controllerName = handlerArr[0]
            const actionName = handlerArr[1]

            const modulePath = `${app().controllerPath}/${controllerName}`
            const Controller = require(modulePath).default

            this._handler = {
                controller: Controller,
                action: actionName,
            }
        }
    }

    handle(request, response) {
        if (_.isFunction(this._handler)) {
            return this._handler.apply(null, [request, response])
        } else {
            const Controller = this._handler.controller
            const actionName = this._handler.action
            const controllerInstance = new Controller(request, response)

            if (!_.isFunction(controllerInstance[actionName])) {
                throw new Error(`action (${actionName}) function not defined`)
            }

            return controllerInstance[actionName]()
        }
    }
}
