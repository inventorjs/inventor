/**
 * 修饰器集合
 *
 * @author : sunkeysun
 */

export function interfaceModel(interfaceConfig) {
    return (target, key, descriptor) => {
        if (_.isUndefined(target.prototype.packData)) {
            target.prototype.packData = (data) => {
                return data
            }
        }

        if (_.isUndefined(target.prototype.packOptions)) {
            target.prototype.packOptions = (options) => {
                return options
            }
        }

        target.prototype.sendRequest = (apiName, data={}, options={}) => {
            const url = interfaceConfig.url
            const apiConfig = interfaceConfig.api[apiName]
            let apiUrl = `${url}${apiConfig.path}`
            const params = _.get(options, 'params', {})

            _.forOwn(params, (val, key) => {
                apiUrl = apiUrl.replace(`:${key}`, val)
            })

            return app().request[apiConfig.method](apiUrl, data, options)
        }

        _.forOwn(interfaceConfig.api, (api, apiName) => {
            if (_.isUndefined(target.prototype[apiName])) {
                target.prototype[apiName] = (data={}, options={}) => {
                    const packedData = target.prototype.packData(data)
                    const packedOptions = target.prototype.packOptions(options)
                    return target.prototype.sendRequest(apiName, packedData, packedOptions)
                }
            }
        })
    }
}
