/**
 * Http 基础控制器
 *
 * @author : sunkeysun
 */

import IClass from '../support/base/IClass'
import Request from './Request'
import Response from './Response'

export default class Controller extends IClass{
    __options = {}

    constructor(request, response) {
        super()
        this.request = request
        this.response = response

        const requestConfig = app().config('app').request
        const seqHeader = app().request.seqHeader
        if (requestConfig.seqId && request.headers[_.toLower(seqHeader)]) {
            this._options = {
                headers: {
                    [seqHeader]: request.headers[_.toLower(seqHeader)],
                },
            }
        }
    }

    set _options(options) {
        this.__options = _.merge({}, this.__options, options)
    }

    get _options() {
        return this.__options
    }
}
