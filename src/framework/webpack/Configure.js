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
import CleanWebpackPlugin from 'clean-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import FileManagerPlugin from 'filemanager-webpack-plugin'
import autoprefixer from 'autoprefixer'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import HappyPack from 'happypack'
import HashOutput from 'webpack-plugin-hash-output'

const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })

export default class WebpackConfigure {
    _basePath = ''
    _buildMode = ''
    _publicPath = ''
    _vendorEntryPath = ''

    _defaultVendor = [
        'babel-polyfill',
        'query-string',
        'lodash',
        'moment',
        'immutable',
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

    constructor({ basePath, publicPath, buildMode='release' }) {
        this._basePath = basePath
        this._buildMode = buildMode === 'release' ? 'release' : 'debug'
        this._publicPath = publicPath + '/'
        this._vendorEntryPath = path.resolve(this.webPath, 'vendor/__vendor.js')
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

    _template() {
        const outputPath = `${this.buildPath}/web/${this.buildMode}`
        const appConfig = this._getAppsConfig()

        let webpackConfig = {
            mode: this._ifRelease('production', 'development'),
            name: 'inventor',
            entry: appConfig.entry,
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
                        test: /(vendor|node_module).*?\.(less|css)$/,
                        use: ExtractTextPlugin.extract({
                            fallback: 'style-loader',
                            use: [
                                'css-loader',
                                {
                                    loader: 'postcss-loader',
                                    options: {
                                        plugins: [
                                            autoprefixer,
                                        ],
                                    },
                                },
                                'less-loader',
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
                                    loader: 'postcss-loader',
                                    options: {
                                        plugins: [
                                            autoprefixer,
                                        ],
                                    },
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
            optimization: {
                splitChunks: {
                    cacheGroups: {
                        default: false,
                        common: {
                            chunks: 'all',
                            test: /[\\/]shared[\\/]common[\\/]/,
                            name: 'common/common',
                            priority: 99,
                        },
                        vendor: {
                            chunks: 'all',
                            test: /[\\/]node_modules[\\/]|[\\/]vendor[\\/]/,
                            name: 'vendor/vendor',
                            priority: 100,
                        },
                    },
                },
            },
            plugins: [
                new ProgressBarPlugin(),
                new HappyPack({
                    id: 'babel',
                    loaders: ['babel-loader'],
                    threadPool: happyThreadPool,
                }),
                new ExtractTextPlugin({
                    filename: this._ifRelease('[name].[md5:contenthash:hex:20].css', '[name].css'),
                    allChunks: true,
                }),
                new HtmlWebpackPlugin({
                    chunks: [ 'common/common' ],
                    filename: path.resolve(this.sharedPath, 'common/addon/__build.jsx'),
                    template: path.resolve(__dirname, 'addon.tpl'),
                    inject: false,
                }),
                new HtmlWebpackPlugin({
                    chunks: [ 'vendor/vendor' ],
                    filename: path.resolve(this.sharedPath, 'vendor/addon/__build.jsx'),
                    template: path.resolve(__dirname, 'addon.tpl'),
                    inject: false,
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

        webpackConfig.plugins = webpackConfig.plugins.concat(appConfig.plugins)

        if (this._ifRelease('release', 'debug') === 'release') {
            const cleanDirs = appConfig.output.concat(['common', 'vendor'])
            webpackConfig.plugins.push(
                new CleanWebpackPlugin(cleanDirs, {
                    root: path.join(this.buildPath, `/web/${this.buildMode}/`),
                })
            )

            webpackConfig.plugins.push(new HashOutput())
        } else {
            webpackConfig.devtool = 'cheap-module-eval-source-map'
            webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
            webpackConfig.plugins.push(
                new FileManagerPlugin({
                    onEnd: {
                        delete: [ this._vendorEntryPath ],
                    },
                })
            )
        }

        return webpackConfig
    }

    _createEntryFile(appName, appConfig, entryPath) {
        const vendorConfig = require(`${this.configPath}/vendor`).default
        const vendors = _.uniq(this._defaultVendor.concat(vendorConfig.items))

        let tplContent = fs.readFileSync(path.resolve(__dirname, 'entry.tpl'), 'utf-8')
        const importExtra = _.map(appConfig.importExtra, (item, index) => `import '${item}'`).join('\n')
        const importVendors = _.map(vendors, (vendor) => `import "${vendor}"`).join('\n')
        tplContent = tplContent.replace(/<-appName->/g, appName)
                               .replace(/<-importExtra->/g, importExtra)

        fs.writeFileSync(this._vendorEntryPath, importVendors)
        fs.writeFileSync(entryPath, tplContent)
    }

    _getAppsConfig() {
        const appsConfig = require(`${this.configPath}/apps`).default
        let entry = {}
        let plugins = []
        let output = []
        for (let appName in appsConfig) {
            if (!appsConfig[appName].build) {
                continue
            }
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
                }),
            )

            if (this._ifRelease('release', 'debug') === 'release') {
                plugins.push(
                    new FileManagerPlugin({
                        onEnd: {
                            delete: [ entryPath ],
                        },
                    })
                )
            }

            output.push(`apps/${appName}/`)

            this._createEntryFile(appName, config, entryPath)
        }

        return {
            entry,
            plugins,
            output,
        }
    }

    getTemplate() {
        const template = this._template()

        return template
    }
}
