/**
 * 单例基类
 *
 * @author : sunkeysun
 */

export default class Singleton {
    static _instance = null

    static getInstance(params) {
        if (!this._instance) {
            this._instance = new this(params)

            Object.freeze(this)
        }

        return this._instance
    }
}
