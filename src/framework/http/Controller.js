/**
 * Http 基础控制器
 *
 * @author : sunkeysun
 */

import IClass from '../support/base/IClass'
import Request from './Request'
import Response from './Response'

export default class Controller extends IClass{
    constructor(request, response) {
        super()
        this.request = request
        this.response = response
    }
}
