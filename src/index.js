/**
 * 框架入口文件
 *
 * @author : sunkeysun
 */

import HttpKernel from './framework/http/Kernel'

import Controller from './framework/http/Controller'
import Provider from './framework/support/base/Provider'

export default HttpKernel

export {
    Controller,
    Provider,
}
