/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import 'babel-polyfill'

<-importExtra->

import Kernel from 'inventor/web'
import App from '@shared/apps/<-appName->/App.jsx'

const kernel = new Kernel({ App })
kernel.run()
