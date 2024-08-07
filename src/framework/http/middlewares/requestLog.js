/**
 * 日志处理中间件
 *
 * @author : sunkeysun
 */

export default async function requestLog(ctx, next) {
    const startTime = Date.now()

    await next()

    const endTime = Date.now()
    const timeCost = endTime - startTime

    let body = ctx.response.body
    if (_.isString(body)) {
        try {
            body = JSON.parse(body)
        } catch (e) {}
    }

    let jsonBody = body
    try {
        JSON.stringify(jsonBody)
    } catch (e) {
        jsonBody = ''
    }

    try {
        const logInfo = JSON.stringify({
            '[[WebRequest]]': _.pick(ctx.request, ['url', 'method', 'header', 'body']),
            '[[WebResponse]]': { ..._.pick(ctx.response, ['status', 'message', 'header', 'body']), body: jsonBody },
            '[[TimeCost]]': timeCost,
        })

        app().logger.info(logInfo)
    } catch (err) {
        app().logger.error(err);
    }
}
