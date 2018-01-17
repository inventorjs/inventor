/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import 'babel-polyfill'

<-importExtra->

import Kernel from 'inventor/web'
import App from '@shared/apps/<-appName->/App.jsx'

let rootReducer = {}
let rootSaga = function* root() {}

const kernel = new Kernel({ App, rootReducer, rootSaga })
kernel.run()
