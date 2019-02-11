/**
 * crontab 类
 *
 * @author: sunkeysun
 */

export default class Schedule {
    _crontabs = []

    _command = ''
    _options = {}

    get crontabs() {
        return this._crontabs
    }

    _addCrontab(expression) {
        const crontab = {
            expression,
            command: this._command,
            options: this._options,
        }

        this._crontabs.push(crontab)
    }

    command(command, options={}) {
        this._command = command
        this._options = options
        return this
    }

    cron(expression) {
        this._addCrontab(expression)
    }

    everyMinute() {
        this._addCrontab('* * * * *')
    }

    hourly() {
        this._addCrontab('0 */1 * * *')
    }

    daily() {
        this._addCrontab('0 0 */1 * *')
    }

    monthly() {
        this._addCrontab('0 0 1 * *')
    }

    weekly() {
        this._addCrontab('0 0 * * 0')
    }
}