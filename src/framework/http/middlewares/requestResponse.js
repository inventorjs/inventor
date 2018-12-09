/**
 * 初始化中间件
 *
 * @author : sunkeysun
 */

import Request from '../Request'
import Response from '../Response'

export default async function iRequestResponse(ctx, next) {
    ctx.iRequest = new Request(ctx)
    ctx.iResponse = new Response(ctx)

    await next()

    if (ctx.response.status === 404 && ctx.iRequest.route
    && _.isUndefined(ctx.response.body)) {
        throw new Error('You forget set response body or status or lose await next at async middleware')
    }
}
