/**
 * log4js 日志驱动
 *
 * @author : sunkeysun
 */

import Log4js from 'log4js'
import IClass from '../../support/base/IClass'

export default class Log4jsDriver extends IClass {
    _levels = [ 'debug', 'info', 'warn', 'error' ]

    _modes = [ 'console', 'single', 'dateFile', 'levelDateFile', 'levelDirDateFile' ]

    _dateFileConfig = {
        type: 'dateFile',
        filename: '',
        alwaysIncludePattern: true,
        pattern: 'yyyyMMddhh.log',
    }

    _levelFilterConfig = {
        type: 'logLevelFilter',
        appender: 'level',
        level: 'level',
    }

    _layout = {
        type: 'pattern',
        pattern: '[%d] [%p] %m',
    }

    _config = {
        appenders: {
        },
        categories: {
            default: { appenders: ['debug'], level: 'debug'}
        },
        pm2: true,
        replaceConsole: true,
    }

    constructor(logConfig) {
        super()

        if (!~this._modes.indexOf(logConfig.mode)) {
            throw new IException(`log config mode is invalid! must value of ${JSON.stringify(this._modes)}`)
        }

        const logPath = logConfig.logPath
        const layout = { ...this._layout, ..._.get(logConfig, 'layout', {}) }

        if (logConfig.mode === 'console') {
            this._config.appenders = {
                default: {
                    type: 'console',
                    layout,
                },
            }
            this._config.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else if (logConfig.mode === 'single') {
            this._config.appenders = {
                default: {
                    type: 'file',
                    filename: `${logPath}/log.txt`,
                    layout,
                },
            }
            this._config.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else if (logConfig.mode === 'dateFile') {
            this._config.appenders = {
                default: {
                    ...pattern,
                    pattern: _.get(logConfig, 'pattern', this._dateFileConfig.pattern),
                    filename: `${logPath}/log-`,
                    layout,
                }
            }
            this._config.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else {
            this._config.appenders = _.reduce(this._levels, (result, level) => {
                let filename = ''
                if (logConfig.mode === 'levelDateFile') {
                    filename = `${logPath}/${level}-`
                } else if (logConfig.mode === 'levelDirDateFile') {
                    filename = `${logPath}/${level}/`
                }

                return {
                    ...result,
                    [level]: {
                        ...this._dateFileConfig,
                        pattern: _.get(logConfig, 'pattern', this._dateFileConfig.pattern),
                        filename: filename,
                        layout,
                    },
                }
            }, this._config.appenders)

            this._config.categories = _.reduce(this._levels, (result, level) => {
                return {
                    ...result,
                    [level]: {
                        level,
                        appenders: [ `${level}` ],
                    },
                }
            }, this._config.categories)
        }

        Log4js.configure(this._config)

        _.each(this._levels, (level) => {
            this[level] = (msg, category='default') => {
                const realMsg = `${category} - ${msg}`
                Log4js.getLogger(level)[level](realMsg)
            }
        })
    }
}
