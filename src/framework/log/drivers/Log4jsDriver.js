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
            throw new IException(`log config mode is invalid! must value of ${JSON.stringify(this._modes)}`)
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
                    ...pattern,
                    pattern: _.get(logConfig, 'pattern', _dateFileConfig.pattern),
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
                if (logConfig.mode === 'levelDateFile') {
                    filename = `${logPath}/${level}-`
                } else if (logConfig.mode === 'levelDirDateFile') {
                    filename = `${logPath}/${level}/`
                }

                return {
                    ...result,
                    [level]: {
                        ...this._dateFileConfig,
                        pattern: _.get(logConfig, 'pattern', _dateFileConfig.pattern),
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
            this[level] = (msg, category='default') => {
                Log4js.getLogger(category)[level](msg)
            }
        })
    }
}
