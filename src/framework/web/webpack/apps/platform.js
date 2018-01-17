/**
 * 应用入口
 *
 * @author : sunkeysun
 */



import 'babel-polyfill'
import Kernel from 'inventor/web'
import App from '@shared/apps/platform/App.jsx'
import * as rootReducer from '@shared/apps/platform/reducers'
import rootSaga from '@shared/apps/platform/sagas'

const kernel = new Kernel({ App, rootReducer, rootSaga })
kernel.run()
