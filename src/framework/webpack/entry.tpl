/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import 'babel-polyfill'

<-importExtra->

import Kernel from 'inventor/web'
import App from '@shared/apps/<-appName->/App'
import reducers from '@shared/apps/<-appName->/redux'
import webpackConfig from '@webpack/config'

const kernel = new Kernel({ webpackConfig, App, reducers })
kernel.run()