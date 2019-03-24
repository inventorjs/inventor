/**
 * seqId 中间件
 *
 * @author: sunkeysun
 */

export default async function seqId(ctx, next) {
    const requestConfig = app().config('app').request
    const seqHeader = app().request.seqHeader
    const seqId = request.headers[_.toLower(seqHeader)]
    if (requestConfig.seqId && seqId) {
        process.context.set('seqId', seqId)
    }

    await next()
}