/**
 * 装饰器集合
 *
 * @author : sunkeysun
 */

export function interfaceModel(interfaceConfig) {
    return (Target, key, descriptor) => {
        const url = interfaceConfig.url

        if (_.isUndefined(Target._packData)) {
            Target._packData = function(data, apiData) {
                return data
            }
        }

        if (_.isUndefined(Target.success)) {
            Target.success = function(res) {
                return res.code === 0
            }
        }

        Target.__sendRequest = function(apiConfig, data={}, options={}) {
            const packedData = this._packData(data, apiConfig.data)
            const apiOptions = _.get(apiConfig, 'options', {})
            const moduleOptions = _.get(interfaceConfig, 'options', {})
            const packedOptions = _.merge({}, moduleOptions, apiOptions, options)

            let apiUrl = `${url}${apiConfig.path}`
            const params = _.get(options, 'params', {})

            _.forOwn(params, (val, key) => {
                apiUrl = apiUrl.replace(`:${key}`, val)
            })

            return app().request[apiConfig.method](apiUrl, packedData, packedOptions)
        }

        _.forOwn(interfaceConfig.api, (apiConfig, apiName) => {
            if (_.isUndefined(Target[apiName])) {
                Target[apiName] = function(data={}, options={}) {
                    return this.__sendRequest(apiConfig, data, options)
                }
            }
        })
    }
}
