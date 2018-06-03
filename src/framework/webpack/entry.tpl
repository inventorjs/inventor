/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import '@web/vendor/__vendor'

<-importExtra->

import Kernel from 'inventor/web'
import App from '@shared/apps/<-appName->/App'
import reducers from '@shared/apps/<-appName->/redux'
import webpackConfig from '@webpack/config'
import appConfig from '@shared/common/config/app'

const kernel = new Kernel({ webpackConfig, appConfig, App, reducers })
kernel.run()
