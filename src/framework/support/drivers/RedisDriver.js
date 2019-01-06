/**
 * redis 驱动
 *
 * @author : sunkeysun
 */

import Redis from 'ioredis'

import Driver from '../base/Driver'

export default class RedisDriver extends Driver {
    _redis = null

    constructor(redisConfig) {
        super()

        const options = _.get(redisConfig, 'options', {})

        if (redisConfig.mode === 'cluster') {
            const clusterOptions = _.get(redisConfig, 'clusterOptions', {})
            clusterOptions.redisOptions = options
            this._redis = new Redis.Cluster(redisConfig.servers, clusterOptions)
        } else if (redisConfig.mode === 'single') {
            const targetServer = _.get(redisConfig.servers, '0', {})
            this._redis = new Redis({ ...options, ...targetServer })
        }

        if (!this._redis) {
            return {}
        }

        this._redis.on('connect', () => {
            app().emit(app().event('redis-connect'), redisConfig)
            app().logger.info(`redis connect [${JSON.stringify(redisConfig)}]`, 'redis')
        })
        this._redis.on('ready', () => {
            app().emit(app().event('redis-ready'), redisConfig)
            app().logger.info(`redis ready [${JSON.stringify(redisConfig)}]`, 'redis')
        })
        this._redis.on('error', (e) => {
            app().emit(app().event('redis-error'), e, redisConfig)
            app().logger.error(`redis error [${JSON.stringify(redisConfig)}] - ${e}`, 'redis')
        })

        return this._redis
    }
}
