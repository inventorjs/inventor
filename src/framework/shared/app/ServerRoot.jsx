/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'

import configureStore from './store/configureStore'

export default class extends Component {
    render() {
        const { content={}, store, location='/' } = this.props

        return (
            <Provider store={ store }>
                <ConnectedRouter location={ location } context={ context }>
                    <App />
                </ConnectedRouter>
            </Provider>
        )
    }
}
