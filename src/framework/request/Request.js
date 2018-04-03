/**
 * 请求服务类
 *
 * @author : sunkeysun
 */

import qs from 'query-string'
import axios from 'axios'
import uuid from 'uuid/v1'

import IClass from '../support/base/IClass'

const CancelToken = axios.CancelToken

export default class extends IClass {
    _config = {
        logRequest: true,
        autoUA: false,
        seqHeader: false,
    }

    _jsonpCount = 10000

    _jsonpConfig = {
        timeout: 10000,
        prefix: 'jsonp',
        callback: 'callback',
    }

    _defaultConfig = {
        url: '',
        method: '',
        params: {},
        data: {},
        headers: {
            'X-Async-Request': true,
        },
        withCredentials: true,
        responseType: 'json',
        xsrfCookieName: 'CSRF-TOKEN',
        xsrfHeaderName: 'X-Csrf-Token',
        maxContentLength: 10 * 1024 * 1024,
        timeout: 10 * 1000,
        maxRedirects: 0,
    }

    _defaultCustomConfig = {
        httpResponse: false,
        requestInterceptors: [],
        responseInterceptors: [],
    }

    _raceMap = {}

    constructor(config={}) {
        super()

        this._config = { ...this._config, ...config }
    }

    get(url, data, config={}) {
        const targetConfig = {
            ...config,
            method: 'get',
            url: url,
            params: data,
        }

        return this._send(targetConfig)
    }

    post(url, data, config={}) {
        const targetConfig = {
            ...config,
            method: 'post',
            url: url,
            data: data,
        }

        return this._send(targetConfig)
    }

    put(url, data, config={}) {
        const targetConfig = {
            ...config,
            method: 'put',
            url: url,
            data: data,
        }

        return this._send(targetConfig)
    }

    delete(url, data, config={}) {
        const targetConfig = {
            ...config,
            method: 'delete',
            url: url,
            params: data,
        }

        return this._send(targetConfig)
    }

    patch(url, data, config={}) {
        const targetConfig = {
            ...config,
            method: 'patch',
            url: url,
            data: data,
        }

        return this._send(targetConfig)
    }

    jsonp(url, data={}, config={}) {
        if (!app().isBrowser) {
            throw new IException('jsonp only used in browser')
        }

        return new Promise((resolve, reject) => {
            const targetConfig = { ...this._jsonpConfig, ..._.pick(config, _.keys(this._jsonpConfig)) }
            const jsonpId = targetConfig.prefix + (++this._jsonpCount%_.toSafeInteger(_.pad('', 20, '9')))
            let script = null

            const realData = { ...data, [targetConfig.callback]: jsonpId, _: Date.now() }
            const realUrl = url.split('?')[0] + '?' + qs.stringify(realData)
            let timer = null

            const cleanup = () => {
                if (script) {
                    document.body.removeChild(script)
                    script = null
                }
                if (timer) {
                    clearTimeout(timer)
                    timer = null
                }

                global[jsonpId] = () => {
                    return reject(new IException('jsonp has been cleanup'))
                }
            }

            global[jsonpId] = (data) => {
                cleanup()
                resolve(data)
            }

            script  = document.createElement('script')
            script.src = realUrl
            document.body.append(script)

            timer = setTimeout(() => {
                cleanup()
                return reject(new IException('jsonp response timeout'))
            }, targetConfig.timeout)
        })
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

        let logLevel = 'info'
        let response = res
        let data = _.get(res, 'config.data', {})

        if (_.isError(response)) {
            logLevel = 'error'
            if (!_.isUndefined(res.response)) {
                response = res.response
            }
        }

        if (_.isString(_.get(res, 'config.data'))) {
            try {
                data = JSON.parse(res.config.data)
            } catch (e) {
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
            targetConfig.headers = _.defaults({}, this._defaultConfig.headers, targetConfig.headers)
        }

        if (!this._config.autoUA) {
            targetConfig.headers['User-Agent'] = app().version
        }

        if (this._config.seqHeader) {
            targetConfig.headers[this._config.seqHeader] = uuid()
        }

        if (!~['get', 'delete'].indexOf(_.toLower(config.method))) {
            _.unset(targetConfig, 'params')
        }

        const cancelSource = CancelToken.source()

        targetConfig.cancelToken = cancelSource.token

        const raceKey = config.raceKey
        if (raceKey) {
            if (this.raceMap[raceKey]) {
                this.raceMap[raceKey].cancel()
            } else {
                this.raceMap[raceKey] = cancelSource
            }
        }

        const startTime = Date.now()
        const instance = axios.create()

        instance.interceptors.request.use((request) => {
            return request
        })

        instance.interceptors.response.use((response) => {
            if (raceKey && this.raceMap[raceKey]) {
                this.raceMap[raceKey] = null
            }

            const timeCost = Date.now() - startTime
            this._logInfo(response, timeCost)

            if (customConfig.httpResponse) {
                return _.pick(response, ['status', 'statusText', 'headers', 'data'])
            } else {
                return response.data
            }
        }, (e) => { throw e } )

        if (_.get(customConfig.requestInterceptors, 'length')) {
            _.each(customConfig.requestInterceptors,
                (interceptor) => instance.interceptors.request.use(interceptor, (e) => { throw e } ))
        }

        if (_.get(customConfig.responseInterceptors, 'length')) {
            _.each(customConfig.responseInterceptors,
                (interceptor) => instance.interceptors.response.use(interceptor, (e) => { throw e } ))
        }

        try {
            const res = await instance.request(targetConfig)
            return res
        } catch (e) {
            if (raceKey && this.raceMap[raceKey]) {
                this.raceMap[raceKey] = null
            }

            const timeCost = Date.now() - startTime
            this._logInfo(e, timeCost)

            throw new IException(e)
        }
    }
}
