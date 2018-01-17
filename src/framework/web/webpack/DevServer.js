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

    constructor({ basePath, publicPath, serverConfig, webServer, buildMode } ) {
        const configure = new WebpackConfigure({ basePath, publicPath, buildMode })
        const webpackConfig = configure.getTemplate()

        webpackConfig.entry = _.mapValues(webpackConfig.entry, (val, key) => {
            const newVal = [
                `webpack-dev-server/client?${publicPath}`,
                'webpack/hot/dev-server',
                ...val,
            ]
            return newVal
        })

        webpackConfig.plugins.push(
            new webpack.NamedModulesPlugin(),
            new webpack.HotModuleReplacementPlugin()
        )

        const compiler = webpack(webpackConfig)
        this._server = new WebpackDevServer(compiler, {
            contentBase: '/',
            hot: true,
            publicPath: publicPath,
            historyApiFallback: true,
            headers: {
                'Access-Control-Allow-Origin': `http://${webServer.host}:${webServer.port}`,
                'Access-Control-Allow-Credentials': true,
            },
        })

        this._serverConfig = serverConfig
    }

    run() {
        this._server.listen(this._serverConfig.port, this._serverConfig.host)
    }
}
