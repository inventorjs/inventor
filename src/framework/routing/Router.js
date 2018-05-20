/**
 * 路由处理器
 *
 * @author : sunkeysun
 */

import path from 'path'
import CoreRouter from 'koa-router'

import IClass from '../support/base/IClass'
import Route from './Route'
import Request from '../http/Request'
import Response from '../http/Response'
import { normalizeMiddleware } from '../support/helpers'

const coreRouter = new CoreRouter()

export default class Router extends IClass {
    _routePath = ''
    _options={
        middlewares: [],
        locals: {},
    }

    get routePath() {
        return this._routePath
    }

    set routePath(routePath) {
        this._routePath = routePath
    }

    set options(options) {
        this._options = options
    }

    get(...args) {
        args.unshift('get')
        return this._handle(...args)
    }

    post(...args) {
        args.unshift('post')
        return this._handle(...args)
    }

    put(...args) {
        args.unshift('put')
        return this._handle(...args)
    }

    delete(...args) {
        args.unshift('delete')
        return this._handle(...args)
    }

    patch(...args) {
        args.unshift('patch')
        return this._handle(...args)
    }

    resource(resource, controller, options) {
        this.post(`${resource}`, `${controller}@add`, options)
        this.delete(`${resource}/:id`, `${controller}@remove`, options)
        this.put(`${resource}/:id`, `${controller}@update`, options)
        this.get(`${resource}`, `${controller}@list`, options)
        this.get(`${resource}/:id`, `${controller}@query`, options)
    }

    group(prefix, handler, { middlewares=[], locals={} }={}) {
        const prePrefix = this._routePath
        const routePath = `${prePrefix}${prefix}`
        const groupRouter = _.cloneDeep(this)

        groupRouter.routePath = routePath
        groupRouter.options = {
            middlewares: _.uniq([ ...groupRouter._options.middlewares, ...middlewares ]),
            locals: { ...groupRouter._options.locals, ...locals },
        }

        handler(groupRouter)

        return groupRouter
    }

    routes() {
        return coreRouter.routes()
    }

    _getMiddlewareHandlers(middlewares=[]) {
        const middlewareHandlers = _.map(middlewares, (Middleware) => {
            return normalizeMiddleware(Middleware.handle.bind(Middleware))
        })

        return middlewareHandlers
    }

    _handle(method, routePath, handler, { middlewares=[], locals={} }={}) {
        const prefix = _.get(this, 'routePath', '')
        if (_.isArray(routePath)) {
            routePath = _.map(routePath, (routePathItem) => {
                return path.posix.normalize(`${prefix}${routePathItem}`)
            })
        } else {
            routePath = path.posix.normalize(`${prefix}${routePath}`)
        }

        const allLocals = { ...this._options.locals, ...locals }
        const allMiddlewares = _.uniq([ ...this._options.middlewares, ...middlewares])
        const middlewareHandlers = this._getMiddlewareHandlers(allMiddlewares)

        const route = new Route({
            handler,
            path: routePath,
            middlewares: middlewareHandlers,
            locals: allLocals,
        })

        const routeHandler = async (ctx, next) => {
            ctx.onerror = (e) => {
                if (!e) return ;

                const event = app().event('route-error')
                app().emit(event, e, ctx)
            }

            await route.handle(ctx.iRequest, ctx.iResponse)
        }

        const routeMiddleware = async (ctx, next) => {
            ctx.iRequest.route = route;
            await next()
        }

        const routeArgs = [ route.path, routeMiddleware, ...route.middlewares, routeHandler]

        coreRouter[method].apply(coreRouter, routeArgs)

        return this
    }
}
