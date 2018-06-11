/**
 * 请求超时处理中间件
 *
 * @author : sunkeysun
 */

const DEFAULT_TIMEOUT = 3000

export default async function RequestTimeout(ctx, next) {
    const timeout = _.get(app().config('app'), 'timeout', DEFAULT_TIMEOUT)

    const timeoutValue = Symbol('timeout')
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(timeoutValue)
        }, timeout)
    })

    await Promise.race([
        next(),
        timeoutPromise,
    ])
    .then((value) => {
        if (value === timeoutValue) {
            const e = IException(`server timeout(${timeout}ms)`)

            const event = app().event('app-timeout')
            if (app().listenerCount(event) > 0) {
                return app().emit(event, e, ctx.iRequest, ctx.iResponse)
            }

            throw e
        }
    })
}
