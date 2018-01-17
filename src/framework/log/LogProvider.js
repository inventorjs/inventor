/**
 * 日志服务提供者
 *
 * @author : sunkeysun
 */

import Provider from '../support/base/Provider'
import Log4jsDriver from './drivers/Log4jsDriver'

export default class LogProvider extends Provider {
    register() {
        const logConfig = app().config('log')

        const logger = new Log4jsDriver(logConfig)

        return logger
    }
}
