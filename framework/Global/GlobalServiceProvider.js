/**
 * 全局变量注册服务
 *
 * @author : sunkeysun
 */

import ServiceProvider from '../Support/ServiceProvider'
import IException from '../Support/IException'
import _ from 'lodash'

export default class GlobalServiceProvider extend ServiceProvider {
    register(app) {
        _.extend(global, {
            _,
            $app: app,
            IException,
        })

        return global
    }
}
