/**
 * 响应基础类
 *
 * @author : sunkeysun
 */

export default class Response {
    _res = null

    constructor(res) {
        this._res = res
    }

    json(result) {
        result = result || {}

    }
}
