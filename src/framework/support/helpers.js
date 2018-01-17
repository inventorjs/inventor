/**
 * 通用助手
 *
 * @author : sunkesyun
 */

import fs from 'fs'

export function config(configName) {
    const configPath = `${app().configPath}/${configName}`
    const env = app().env

    const envConfigPath = `${app().configPath}/${env}/${configName}`
    let configModule = null

    if (fs.existsSync(`${envConfigPath}.js`)) {
        configModule = require(envConfigPath)
    } else {
        configModule = require(configPath)
    }

    if (!_.isUndefined(configModule.default)) {
        configModule = configModule.default
    }

    return configModule
}

export function normalizeMiddleware(middleware) {
    return async (ctx, next) => {
        const request = ctx.iRequest
        const response = ctx.iResponse
        const nextResult = { next: false }

        middleware(request, response, () => { nextResult.next = true })

        if (nextResult.next) {
            await next()
        }
    }
}
