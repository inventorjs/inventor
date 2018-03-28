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

        const requestSeqHeader = app().sharedConfig('app').requestSeqHeader
        if (requestSeqHeader && request.headers[_.toLower(requestSeqHeader)]) {
            this._options = {
                headers: {
                    [requestSeqHeader]: request.headers[_.toLower(requestSeqHeader)],
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
