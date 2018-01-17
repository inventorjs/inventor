/**
 * 路由类
 *
 * @author : sunkeysun
 */

import IClass from '../support/base/IClass'

export default class Route extends IClass {
    _handler = null
    _type = 'callback'
    _action = ''

    constructor(handler) {
        super()

        if (!!_.isFunction(handler)) {
            this._handler = handler
            this._type = 'callback'
        } else if (!!_.isString(handler)) {
            if (!~handler.indexOf('@')) {
                throw new IException('action not exist.')
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
            this._type = 'controller'
        }
    }

    handle(request, response) {
        if (this._type === 'callback') {
            return this._handler.apply(null, [request, response])
        } else {
            const Controller = this._handler.controller
            const actionName = this._handler.action
            const controllerInstance = new Controller(request, response)

            if (!_.isFunction(controllerInstance[actionName])) {
                throw new IException('action not a function.')
            }

            return controllerInstance[actionName]()
        }
    }
}
