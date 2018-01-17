/**
 * 初始化中间件
 *
 * @author : sunkeysun
 */

import Request from '../Request'
import Response from '../Response'

export default async function(ctx, next) {
    ctx.iRequest = new Request(ctx)
    ctx.iResponse = new Response(ctx)

    await next()
}
