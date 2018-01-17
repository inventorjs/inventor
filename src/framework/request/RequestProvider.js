/**
 * server端请求提供者
 *
 * @author : sunkeysun
 */

import axios from 'axios'
import Provider from '../support/base/Provider'
import Request from './Request'

export default class RequestProvicer extends Provider {
    register(config) {
        const request = new Request(config)

        return request
    }
}
