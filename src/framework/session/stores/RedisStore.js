/**
 * redis session 存储驱动
 *
 * @author : sunkeysun
 */
import DEBUG from 'debug'
import IClass from '../../support/base/IClass'
import RedisDriver from '../../support/drivers/RedisDriver'

import { serialize, unserialize } from '../helpers'

const debug = DEBUG('inventor:session')

export default class RedisStore extends IClass {
    _redis = null

    constructor(redisConfig) {
        super()

        this._redis = new RedisDriver(redisConfig)
    }

    async get(sid, maxAge, { rolling }) {
        try {
            const data = await this._redis.get(sid)
            const resultData = unserialize(data)
            debug(`key: ${sid} data: ${data} resultData: ${resultData}`)
            return resultData
        } catch (e) {
            debug(`key: ${sid} error: ${e}`)
            app().emit(app().event('session-error'), e, 'get')
            return false
        }
    }

    async set(sid, sess, maxAge, { changed, rolling }) {
        try {
            return await this._redis.set(sid, serialize(sess), 'EX', Math.floor(maxAge/1000))
        } catch (e) {
            app().emit(app().event('session-error'), e, 'set')
            return false
        }
    }

    async destroy(sid) {
        try {
            return await this._redis.del(sid)
        } catch (e) {
            app().emit(app().event('session-error'), e, 'destroy')
        }
    }
}
