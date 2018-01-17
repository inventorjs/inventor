/**
 * 日志处理中间件
 *
 * @author : sunkeysun
 */

export default async function (ctx, next) {
    const startTime = Date.now()

    await next()

    const endTime = Date.now()
    const timeCost = endTime - startTime

    let body = ctx.response.body
    try {
        body = JSON.parse(body)
    } catch (e) {}


    const logInfo = JSON.stringify({
        '[[WebRequest]]': _.pick(ctx.request, ['url', 'method', 'header', 'body']),
        '[[WebResponse]]': { ..._.pick(ctx.response, ['status', 'message', 'header', 'body']), body },
        '[[TimeCost]]': timeCost,
    })

    app().logger.info(logInfo)
}
