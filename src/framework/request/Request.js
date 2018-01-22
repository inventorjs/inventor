/**
 * 请求服务类
 *
 * @author : sunkeysun
 */

import axios from 'axios'
import IClass from '../support/base/IClass'
import { autobind } from 'core-decorators'

export default class extends IClass {
    _config = {
        logRequest: true,
    }

    _defaultConfig = {
        url: '',
        method: '',
        params: {},
        data: {},
        headers: {
            'X-POWERED-BY': `${app().version}`
        },
        withCredentials: true,
        responseType: 'json',
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
        maxContentLength: 10 * 1024 * 1024,
        timeout: 10 * 1000,
    }

    _defaultCustomConfig = {
        httpResponse: false,
    }

    constructor(config) {
        super()

        this._config = _.extend({}, this._config, config)
    }

    @autobind
    get(url, data, config) {
        const targetConfig = _.extend({}, config, {
            method: 'get',
            url: url,
            params: data,
        })

        return this._send(targetConfig)
    }

    @autobind
    post(url, data, config) {
        const targetConfig = _.extend({}, config, {
            method: 'post',
            url: url,
            data: data,
        })

        return this._send(targetConfig)
    }

    @autobind
    put(url, data, config) {
        const targetConfig = _.extend({}, config, {
            method: 'put',
            url: url,
            data: data,
        })

        return this._send(targetConfig)
    }

    @autobind
    delete(url, config) {
        const targetConfig = _.extend({}, config, {
            method: 'delete',
            url: url,
        })

        return this._send(targetConfig)
    }

    @autobind
    patch(url, data, config) {
        const targetConfig = _.extend({}, config, {
            method: 'patch',
            url: url,
            data: data,
        })

        return this._send(targetConfig)
    }

    _normalizeHttp(obj) {
        return _.mapKeys(obj, (val, key) => {
            switch(key) {
                case 'statusText':
                    return 'message'
                case 'headers':
                    return 'header'
                case 'data':
                    return 'body'
                case 'params':
                    return 'query'
                default:
                    return key
            }
        })
    }

    _logInfo(res, timeCost) {
        if (!this._config.logRequest) {
            return false
        }

        let data = res.config.data
        if (_.isString(_.get(res, 'config.data'))) {
            try {
                data = JSON.parse(res.config.data)
            } catch (e) {
            }
        }

        let logLevel = 'info'
        let response = res
        if (!!_.isError(response)) {
            logLevel = 'error'
            if (!_.isUndefined(res.response)) {
                response = res.response
            }
        }
        const logStr = JSON.stringify({
            '[[Request]]': this._normalizeHttp({ ..._.pick(_.get(res, 'config'), ['url', 'method', 'headers', 'params']), data }),
            '[[Response]]': this._normalizeHttp(_.pick(response, ['code', 'message', 'stack', 'status', 'statusText', 'headers', 'data'])),
            '[[TimeCost]]': timeCost,
        })

        app().logger[logLevel](logStr)
    }

    async _send(config) {
        const targetConfig = { ...this._defaultConfig, ..._.pick(config, _.keys(this._defaultConfig)) }
        const customConfig = { ...this._defaultCustomConfig, ..._.pick(config, _.keys(this._defaultCustomConfig)) }

        if (targetConfig.headers) {
            targetConfig.headers = { ...this._defaultConfig.headers, ...targetConfig.headers }
        }

        const startTime = Date.now()

        try {
            const res = await axios.request(targetConfig)
            const timeCost = Date.now() - startTime
            this._logInfo(res, timeCost)

            if (!!customConfig.httpResponse) {
                return _.pick(res, ['status', 'statusText', 'headers', 'data'])
            } else {
                return res.data
            }
        } catch(e) {
            const timeCost = Date.now() - startTime
            this._logInfo(e, timeCost)

            throw new IException(e)
        }
    }
}
