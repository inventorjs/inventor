/**
 * webpack 开发服务器
 *
 * @author : sunkeysun
 */

import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import WebpackConfigure from './Configure'
import _ from 'lodash'

export default class DevServer {
    _server = null
    _serverConfig = null

    constructor({ basePath, publicPath, localWeb, localServer, buildMode } ) {
        const devServer = true
        const configure = new WebpackConfigure({ basePath, publicPath, buildMode, devServer })
        const webpackConfig = configure.getTemplate()

        webpackConfig.entry = _.mapValues(webpackConfig.entry, (val, key) => {
            const newVal = [
                `webpack-dev-server/client?http://${localWeb.host}:${localWeb.port}/`,
                'webpack/hot/only-dev-server',
                ...val,
            ]
            return newVal
        })

        const compiler = webpack(webpackConfig)
        this._server = new WebpackDevServer(compiler, {
            contentBase: '/',
            hot: true,
            publicPath: publicPath+'/',
            historyApiFallback: true,
            headers: {
                'Access-Control-Allow-Origin': `http://${localServer.host}:${localServer.port}`,
                'Access-Control-Allow-Credentials': true,
            },
            watchOptions: {
                ignored: /node_modules/,
            },
        })

        this._serverConfig = localWeb
    }

    run() {
        if (!this._serverConfig || !this._serverConfig.port || !this._serverConfig.host) {
            throw new Error('devServer "serverConfig" must have valid host and port')
        }
        this._server.listen(this._serverConfig.port, this._serverConfig.host)
    }
}
