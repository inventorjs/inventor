/**
 * webpack 配置类
 *
 * @author : sunkeysun
 */

import path from 'path'
import fs from 'fs'
import os from 'os'
import _ from 'lodash'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import ParallelUglifyJsPlugin from 'webpack-parallel-uglify-plugin'
import autoprefixer from 'autoprefixer'
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import HappyPack from 'happypack'

const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })

export default class WebpackConfigure {
    _basePath = ''
    _buildMode = ''
    _publicPath = ''
    _devServer = false

    _defaultVendor = [
        'babel-polyfill',
        'query-string',
        'lodash',
        'moment',
        'axios',
        'react',
        'react-dom',
        'react-router',
        'react-router-config',
        'react-router-dom',
        'react-router-redux',
        'redux',
        'react-redux',
        'core-decorators',
        'inventor/web',
        'inventor/shared',
    ]

    constructor({ basePath, publicPath, buildMode='release', devServer=false }) {
        this._basePath = basePath
        this._buildMode = buildMode === 'release' ? 'release' : 'debug'
        this._publicPath = publicPath + '/'
        this._devServer = devServer
    }

    get webPath() {
        return `${this._basePath}/web`
    }

    get buildPath() {
        return `${this._basePath}/build`
    }

    get sharedPath() {
        return `${this._basePath}/shared`
    }

    get configPath() {
        return `${this.webPath}/config`
    }

    get buildMode() {
        return this._buildMode
    }

    _ifRelease(release, debug) {
        return this.buildMode === 'release' ? release : debug
    }

    _template(name, entry, plugins=[]) {
        const outputPath = `${this.buildPath}/web/${this.buildMode}`

        let webpackConfig = {
            name: name,
            entry: entry,
            output: {
                filename: this._ifRelease('[name].[chunkhash].js', '[name].js'),
                path: outputPath,
                publicPath: this._publicPath,
            },
            module: {
                rules: [
                    {
                        test: /\.jsx?$/,
                        use: [
                            'happypack/loader?id=babel',
                        ],
                        exclude: /node_modules/,
                    },
                    {
                        test: /(vendor|node_module).*?\.less$/,
                        use: ExtractTextPlugin.extract({
                            disable: this._ifRelease(false, true),
                            fallback: 'style-loader',
                            use: [
                                'css-loader',
                                'less-loader',
                            ],
                        }),
                    },
                    {
                        test: /(vendor|node_module).*?\.css$/,
                        use: ExtractTextPlugin.extract({
                            fallback: 'style-loader',
                            use: [
                                'css-loader',
                            ],
                        }),
                    },
                    {
                        test: /\.scss$/,
                        exclude: /(node_modules|vendor)/,
                        use: ExtractTextPlugin.extract({
                            fallback: 'style-loader',
                            use: [
                                {
                                    loader: 'css-loader',
                                    query: {
                                        module: true,
                                        localIdentName: '[name]__[local]--[hash:base64:5]',
                                    }
                                },
                                {
                                    loader: 'sass-loader',
                                },
                            ],
                        }),
                    },
                    {
                        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
                        use: [
                            {
                                loader: 'url-loader',
                                query: {
                                    limit: 1,
                                    name: 'resources/[name].[ext]?[hash]',
                                }
                            },
                        ],
                    }
                ],
            },
            plugins: [
                new webpack.NoEmitOnErrorsPlugin(),
                new webpack.DefinePlugin({
                    'process.env.NODE_ENV': this._ifRelease(JSON.stringify('production'), JSON.stringify('development')),
                }),
                new HappyPack({
                    id: 'babel',
                    loaders: [ 'babel-loader' ],
                    threadPool: happyThreadPool,
                }),
                new ExtractTextPlugin(
                    this._ifRelease('[name].[md5:contenthash:hex:20].css', '[name].css'),
                    {
                        allChunks: true,
                    }
                ),
                new webpack.optimize.CommonsChunkPlugin({
                    name: [
                        'common/common',
                        'vendor/vendor',
                    ],
                    minChunks: Infinity,
                }),
            ],
            resolve: {
                extensions: [
                    '.js',
                    '.jsx',
                    '.json',
                ]
            },
        }

        webpackConfig.plugins = webpackConfig.plugins.concat(plugins)

        if (this._ifRelease('release', 'debug') === 'release') {
            webpackConfig.plugins.push(
                new ParallelUglifyJsPlugin({
                    uglifyES: {
                        output: {
                            beautify: false,
                            comments: false,
                        },
                        compress: {
                            warnings: false,
                            drop_console: true,
                            collapse_vars: true,
                            reduce_vars: true,
                        },
                    },
                })
            )
            webpackConfig.plugins.push(
                new OptimizeCssAssetsPlugin({
                    assetNameRegExp: /\.css$/g,
                    cssProcessor: require('cssnano'),
                    cssProcessorOptions: { discardComments: { removeAll: true } },
                    canPrint: true,
                })
            )
            webpackConfig.plugins.unshift(new ProgressBarPlugin())
        } else {
            webpackConfig.devtool = 'cheap-module-eval-source-map'
            webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
        }

        return webpackConfig
    }

    _createEntryFile(appName, appConfig, entryPath) {
        let tplContent = fs.readFileSync(path.resolve(__dirname, 'entry.tpl'), 'utf-8')
        const importExtra = _.map(appConfig.importExtra, (item, index) => `import '${item}'`).join('\n')
        tplContent = tplContent.replace(/<-appName->/g, appName)
                               .replace(/<-importExtra->/g, importExtra)

        return fs.writeFileSync(entryPath, tplContent)
    }

    _getAppsConfig() {
        const appsConfig = require(`${this.configPath}/apps`).default
        let entry = {}
        let plugins = []
        let output = []
        for (let appName in appsConfig) {
            const config = _.extend({}, appsConfig.common, appsConfig[appName])
            const outputName = `apps/${appName}/index`
            const entryPath = path.resolve(this.webPath, `apps/__${appName}.js`)
            entry[outputName] = [ entryPath ]

            plugins.push(
                new HtmlWebpackPlugin({
                    chunks: [ outputName ],
                    filename: path.resolve(this.sharedPath, `apps/${appName}/addon/__build.jsx`),
                    template: path.resolve(__dirname, 'addon.tpl'),
                    inject: false,
                    alwaysWriteToDisk: true,
                })
            )

            output.push(`apps/${appName}/`)

            this._createEntryFile(appName, config, entryPath)
        }

        return {
            entry,
            plugins,
            output,
        }
    }

    _getCommonConfig() {
        const commonConfig = require(`${this.configPath}/common`).default

        let entry = {}
        let plugins = []
        let output = []
        const outputName = `common/common`
        const entryPath = path.resolve(this.sharedPath, 'common/index.js')
        entry[outputName] = [ entryPath ]

        plugins.push(
            new HtmlWebpackPlugin({
                chunks: [ outputName ],
                filename: path.resolve(this.sharedPath, 'common/addon/__build.jsx'),
                template: path.resolve(__dirname, 'addon.tpl'),
                inject: false,
                alwaysWriteToDisk: true,
            })
        )

        output.push('common/')

        return {
            entry,
            plugins,
            output
        }
    }

    _getVendorConfig() {
        const vendorConfig = require(`${this.configPath}/vendor`).default

        let entry = {}
        let plugins = []
        let output = []
        const outputName = `vendor/vendor`
        const entryPaths = _.uniq(this._defaultVendor.concat(vendorConfig.items))
        entry[outputName] = entryPaths

        plugins.push(
            new HtmlWebpackPlugin({
                chunks: [ outputName ],
                filename: path.resolve(this.sharedPath, `vendor/addon/__build.jsx`),
                template: path.resolve(__dirname, 'addon.tpl'),
                inject: false,
                alwaysWriteToDisk: true,
            })
        )

        output.push('vendor/')

        return {
            entry,
            plugins,
            output,
        }
    }

    getTemplate() {
        const vendorConfig = this._getVendorConfig()
        const commonConfig = this._getCommonConfig()
        const appsConfig = this._getAppsConfig()

        const { plugins: vendorPlugins=[], output: vendorOutput=[] } = vendorConfig
        const { plugins: commonPlugins=[], output: commonOutput=[] } = commonConfig
        const { plugins: appsPlugins=[], output: appsOutput=[] } = appsConfig

        const entry = _.extend({}, vendorConfig.entry, commonConfig.entry, appsConfig.entry)
        const plugins = vendorPlugins.concat(commonPlugins).concat(appsPlugins)
        const output = vendorOutput.concat(commonOutput).concat(appsOutput)

        if (!this._devServer) {
            plugins.push(
                new CleanWebpackPlugin(output, {
                    root: path.join(this.buildPath, `/web/${this.buildMode}/`),
                }),
            )
        } else {
            plugins.push( new HtmlWebpackHarddiskPlugin() )
        }

        const template = this._template('template', entry, plugins)

        return template
    }
}
