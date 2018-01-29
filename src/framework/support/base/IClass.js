/**
 * 基础类
 *
 * @author : sunkeysun
 */

export default class IClass {
    static _instance = null

    static get instance() {
        if (!this._instance) {
            this._instance = new this
        }

        return this._instance
    }
}
