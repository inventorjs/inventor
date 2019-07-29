/**
 * schedule 运行命令
 *
 * @author: sunkeysun
 */

import cronParser from 'cron-parser'
import Command from '../Command'

export default class Schedule extends Command {
    static _now = moment().unix()
    // 可容忍误差
    static _margin = 5

    static async handle(options) {
        const crontabs = options.crontabs
        const readyCommands = []
        const commandPromises = []

        _.each(crontabs, (crontab) => {
            if (this._isDue(crontab.expression)) {
                readyCommands.push(crontab.command)
                commandPromises.push(app().runCommand(crontab.command, crontab.options))
            }
        })

        if (readyCommands.length) {
            app().logger.info(`crontab exec ${ readyCommands.length } commands => ${JSON.stringify(readyCommands)} at ${this._now}`, 'crontab')

            try {
                await Promise.all(commandPromises)
            } catch (e) {
                app().logger.error(e, 'crontab-error')
            }
        } else {
            app().logger.info(`crontab no ready commands at ${this._now}`, 'crontab')
        }
    }

    static _isDue(expression) {
        const interval = parser.parseExpression(expression)
        const prevTm = moment(interval.prev()).unix()
        const nextTm = moment(interval.next()).unix()

        if (Math.abs(preTm - this._now) < this._margin || Math.abs(nextTm - this._now) < this._margin) {
            return true
        }

        return false
    }
}