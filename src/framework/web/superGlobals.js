/**
 * 超全局变量
 *
 * @author: sunkeysun
 */

import _ from 'lodash'
import moment from 'moment'

_.extend(window, {
    _,
    moment,
})
