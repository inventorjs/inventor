/**
 * seqId 中间件
 *
 * @author: sunkeysun
 */

import { v4 as uuid } from 'uuid'

export default async function seqId(ctx, next) {
    const requestConfig = app().config('app').request
    const seqHeader = app().request.seqHeader
    const seqId = ctx.request.headers[_.toLower(seqHeader)]
    if (requestConfig.seqId) {
        if (seqId) {
            process.context.set('seqId', seqId)
        } else {
            process.context.set('seqId', uuid())
        }
    }

    await next()
}
