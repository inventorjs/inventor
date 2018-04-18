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

            const path = _.get(apiConfig, 'path', '')
            let apiUrl = `${url}${path}`
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

        return Target
    }
}

export function dbModel() {
    return (Target, key, descriptor) => {

        const db = Target._db
        const tableName = Target._tableName
        const schema = Target._schema

        let hooks = {}
        if (_.isFunction(Target._beforeBulkCreate)) {
            hooks.beforeBulkCreate = Target._beforeBulkCreate.bind(Target)
        }
        if (_.isFunction(Target._beforeBulkDestroy)) {
            hooks.beforeBulkCreate = Target._beforeBulkDestroy.bind(Target)
        }
        if (_.isFunction(Target._beforeBulkUpdate)) {
            hooks.beforeBulkCreate = Target._beforeBulkUpdate.bind(Target)
        }
        if (_.isFunction(Target._beforeValidate)) {
            hooks.beforeBulkCreate = Target._beforeValidate.bind(Target)
        }
        if (_.isFunction(Target._afterValidate)) {
            hooks.beforeBulkCreate = Target._afterValidate.bind(Target)
        }
        if (_.isFunction(Target._validationFailed)) {
            hooks.beforeBulkCreate = Target._validationFailed.bind(Target)
        }
        if (_.isFunction(Target._beforeCreate)) {
            hooks.beforeBulkCreate = Target._beforeCreate.bind(Target)
        }
        if (_.isFunction(Target._beforeDestroy)) {
            hooks.beforeBulkCreate = Target._beforeDestroy.bind(Target)
        }
        if (_.isFunction(Target._beforeUpdate)) {
            hooks.beforeBulkCreate = Target._beforeUpdate.bind(Target)
        }
        if (_.isFunction(Target._beforeSave)) {
            hooks.beforeBulkCreate = Target._beforeSave.bind(Target)
        }
        if (_.isFunction(Target._beforeUpsert)) {
            hooks.beforeBulkCreate = Target._beforeUpsert.bind(Target)
        }
        if (_.isFunction(Target._create)) {
            hooks.beforeBulkCreate = Target._create.bind(Target)
        }
        if (_.isFunction(Target._destroy)) {
            hooks.beforeBulkCreate = Target._destroy.bind(Target)
        }
        if (_.isFunction(Target._update)) {
            hooks.beforeBulkCreate = Target._update.bind(Target)
        }
        if (_.isFunction(Target._afterCreate)) {
            hooks.beforeBulkCreate = Target._afterCreate.bind(Target)
        }
        if (_.isFunction(Target._afterDestroy)) {
            hooks.beforeBulkCreate = Target._afterDestroy.bind(Target)
        }
        if (_.isFunction(Target._afterUpdate)) {
            hooks.beforeBulkCreate = Target._afterUpdate.bind(Target)
        }
        if (_.isFunction(Target._afterSave)) {
            hooks.beforeBulkCreate = Target._afterSave.bind(Target)
        }
        if (_.isFunction(Target._afterUpsert)) {
            hooks.beforeBulkCreate = Target._afterUpsert.bind(Target)
        }
        if (_.isFunction(Target._afterBulkCreate)) {
            hooks.beforeBulkCreate = Target._afterBulkCreate.bind(Target)
        }
        if (_.isFunction(Target._afterBulkDestroy)) {
            hooks.beforeBulkCreate = Target._afterBulkDestroy.bind(Target)
        }
        if (_.isFunction(Target._afterBulkUpdate)) {
            hooks.beforeBulkCreate = Target._afterBulkUpdate.bind(Target)
        }

        const options = _.get(Target, '_options', {})

        const realOptions = {
            ...options,
            tableName,
            hooks,
        }

        const Model = db.define(tableName, schema, realOptions)

        return Model
    }
}
