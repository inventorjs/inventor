/**
 * 基础服务类
 *
 * @author : sunkeysun
 */

import IClass from './IClass'

export default class Service extends IClass {
    success(res={}) {
        return res.code === 0
    }
}
