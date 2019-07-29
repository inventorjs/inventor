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

    _layoutTypes = ['basic', 'messagePassThrough', 'dummy', 'pattern']

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

    _defaultLayout = {
        type: 'pattern',
        pattern: '[%d] [%p] %m',
    }

    _defaultConfig = {
        appenders: {
        },
        categories: {
            default: { appenders: ['debug'], level: 'debug'}
        },
        pm2: true,
        pm2InstanceVar: 'NODE_APP_INSTANCE',
        replaceConsole: true,
    }

    constructor(logConfig) {
        super()

        if (!~this._modes.indexOf(logConfig.mode)) {
            throw new Error(`log config mode is invalid! must value of ${JSON.stringify(this._modes)}`)
        }

        const logPath = logConfig.logPath
        const layout = { ...this._defaultLayout, ..._.get(logConfig, 'layout', {}) }
        const targetConfig = _.extend({}, this._defaultConfig, _.pick(_.keys(this._defaultConfig)))

        if (!~this._layoutTypes.indexOf(layout.type)) {
            Log4js.addLayout(layout.type, layout.format)
        }

        if (logConfig.mode === 'console') {
            targetConfig.appenders = {
                default: {
                    type: 'console',
                    layout,
                },
            }
            targetConfig.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else if (logConfig.mode === 'single') {
            targetConfig.appenders = {
                default: {
                    type: 'file',
                    filename: `${logPath}/log.txt`,
                    layout,
                },
            }
            targetConfig.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else if (logConfig.mode === 'dateFile') {
            targetConfig.appenders = {
                default: {
                    ...pattern,
                    pattern: _.get(logConfig, 'pattern', this._dateFileConfig.pattern),
                    filename: `${logPath}/log-`,
                    layout,
                }
            }
            targetConfig.categories = {
                default: {
                    appenders: [ 'default' ],
                    level: 'debug',
                },
            }
        } else {
            targetConfig.appenders = _.reduce(this._levels, (result, level) => {
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
            }, targetConfig.appenders)

            targetConfig.categories = _.reduce(this._levels, (result, level) => {
                return {
                    ...result,
                    [level]: {
                        level,
                        appenders: [ `${level}` ],
                    },
                }
            }, targetConfig.categories)
        }

        Log4js.configure(targetConfig)

        _.each(this._levels, (level) => {
            this[level] = (msg) => {
                Log4js.getLogger(level)[level](msg)
            }
        })
    }
}
