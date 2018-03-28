/**
 * 基础异常类
 *
 * @author : sunkeysun
 */

export default class IException extends Error {
    constructor(e) {
        super()

        if (_.isString(e)) {
            this.message = e
        } else {
            this.code = _.get(e, 'code')
            this.message = _.get(e, 'message')
            this.stack = _.get(e, 'stack')
        }
    }
}
