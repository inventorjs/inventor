/**
 * 异步上下文中间件
 *
 * @author: sunkeysun
 */

import ac from 'node-async-context'

process.context = ac.create()

export default async function asyncContext(ctx, next) {
    try {
        await next()
        _.result(process.context, 'destroy')
    } catch(e) {
        _.result(process.context, 'destroy')
        throw e
    }
}
