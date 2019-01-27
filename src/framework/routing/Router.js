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
    _inited = false
    _routes = []
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

    resource(resource, controller, options={}) {
        const type = 'resource'

        this.post(`${resource}`, `${controller}@add`, { ...options, type })
        this.delete(`${resource}/:id`, `${controller}@remove`, { ...options, type })
        this.put(`${resource}/:id`, `${controller}@update`, { ...options, type })
        this.get(`${resource}`, `${controller}@list`, { ...options, type })
        this.get(`${resource}/:id`, `${controller}@query`, { ...options, type })
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

    _initRoutes() {
        // 资源路由降低匹配优先级
        const sortedRoutes = [...this._routes].sort((routeA, routeB) => {
            return routeB.type === 'resource'  ? -1 : 0
        })

        _.(sortedRoutes, (route) => {
            coreRouter[route.method].apply(coreRouter, ...route.middlewares, route.handler)
        })

        return true
    }

    routes() {
        if (this.inited) {
            return coreRouter.routes()
        }
        this._initRoutes()
        this._inited = true
        return coreRouter.routes()
    }

    _getMiddlewareHandlers(middlewares=[]) {
        const middlewareHandlers = _.map(middlewares, (Middleware) => {
            return normalizeMiddleware(Middleware.handle.bind(Middleware))
        })

        return middlewareHandlers
    }

    _handle(method, routePath, handler, { middlewares=[], locals={}, type='normal' }={}) {
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
            try {
                await route.handle(ctx.iRequest, ctx.iResponse)
            } catch (e) {
                const event = app().event('route-error')
                if (app().listenerCount(event) > 0) {
                    app().emit(event, e, ctx.iRequest, ctx.iResponse)
                }

                app().logger.error(e, 'route')

                return ctx.iResponse.render500(e)
            }
        }

        const routeMiddleware = async (ctx, next) => {
            ctx.iRequest.route = route;
            await next()
        }

        const routeArgs = [ route.path, routeMiddleware, ...route.middlewares, routeHandler]

        this._routes.push({
            type,
            method,
            path: route.path,
            middlewares: [routeMiddleware, ...route.middlewares],
            handler: routeHandler,
        })

        return this
    }
}
