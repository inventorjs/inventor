/**
 * log4js 日志驱动
 *
 * @author : sunkeysun
 */

import Log4js from 'log4js'
import IClass from '../../support/base/IClass'

export default class Log4jsDriver extends IClass {
    _levels = [ 'debug', 'info', 'warn', 'error' ]

    _modes = [ 'console', 'single', 'dateFile', 'levelFile', 'levelDir' ]

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

    _config = {
        appenders: {
        },
        categories: {
            default: { appenders: ['debug-filter', 'debug'], level: 'debug'}
        },
        pm2: true,
        replaceConsole: true,
    }

    constructor(logConfig) {
        super()

        if (!~this._modes.indexOf(logConfig.mode)) {
            throw new IException('log config mode is invalid!')
        }

        const logPath = logConfig.logPath

        if (logConfig.mode === 'console') {
            this._config.appenders = {
                default: {
                    type: 'console',
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
                    ...this._dateFileConfig,
                    filename: `${logPath}/log-`,
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
                const filterName = `${level}-filter`
                let filename = ''
                if (logConfig.mode === 'levelFile') {
                    filename = `${logPath}/${level}-`
                } else if (logConfig.mode === 'levelDir') {
                    filename = `${logPath}/${level}/${level}-`
                }

                return {
                    ...result,
                    [level]: {
                        ...this._dateFileConfig,
                        datePattern: logConfig.datePattern,
                        filename: filename,
                    },
                    [filterName]: {
                        ...this._levelFilterConfig,
                        appender: level,
                        level: level,
                    },
                }
            }, this._config.appenders)

            this._config.categories = _.reduce(this._levels, (result, level) => {
                return {
                    ...result,
                    [level]: {
                        level,
                        appenders: [ `${level}-filter`, `${level}` ],
                    },
                }
            }, this._config.categories)
        }

        Log4js.configure(this._config)

        _.each(this._levels, (level) => {
            this[level] = (msg) => {
                Log4js.getLogger(level)[level](msg)
            }
        })
    }
}
