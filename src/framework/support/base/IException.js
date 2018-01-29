/**
 * 基础异常类
 *
 * @author : sunkeysun
 */

export default class extends Error {
    constructor(e) {
        super()

        this.code = e.code
        this.message = e.message
        this.stack = e.stack
    }
}
