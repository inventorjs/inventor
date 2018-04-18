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

        let targetConfig = null
        if (redisConfig.mode === 'cluster') {
            targetConfig = redisConfig.servers
        } else if (redisConfig.mode === 'single') {
            targetConfig = redisConfig.servers[0]
        }

        if (!targetConfig) {
            return null
        }

        this._redis = new Redis.Cluster(targetConfig)

        this._redis.on('connect', () => {
            app().emit('redis-connect', targetConfig)
            app().logger.info(`redis connect [${JSON.stringify(targetConfig)}]`, 'redis')
        })
        this._redis.on('ready', () => {
            app().emit('redis-ready', targetConfig)
            app().logger.info(`redis ready [${JSON.stringify(targetConfig)}]`, 'redis')
        })
        this._redis.on('error', (e) => {
            app().emit('redis-error', targetConfig)
            app().logger.error(`redis error [${JSON.stringify(targetConfig)}] - ${e}`, 'redis')
        })
    }

    async get(...args) {
        return await Reflect.apply(this._redis.get, this._redis, args)
    }

    async set(...args) {
        return await Reflect.apply(this._redis.set, this._redis, args)
    }

    async del(...args) {
        return await Reflect.apply(this._redis.del, this._redis, args)
    }
}
