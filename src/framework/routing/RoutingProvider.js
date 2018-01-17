/**
 * 路由服务提供者
 *
 * @author : sunkeysun
 */

import Provider from '../support/base/Provider'
import Router from './Router'

export default class RoutingProvider extends Provider {
    _router = new Router()

    register() {
        const routesPath = app().routesPath
        const routeModule = require(routesPath).default
        routeModule(this._router)

        const routes = this._router.routes()

        return routes
    }
}
