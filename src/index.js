/**
 * 框架入口文件
 *
 * @author : sunkeysun
 */

import HttpKernel from './framework/http/Kernel'

import Controller from './framework/http/Controller'
import Provider from './framework/support/base/Provider'
import Middleware from './framework/support/base/Middleware'
import * as decorators from './framework/support/decorators'

export default HttpKernel

export {
    Controller,
    Provider,
    Middleware,
    decorators,
}
