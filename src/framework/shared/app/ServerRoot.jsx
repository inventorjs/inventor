/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'

export default class extends Component {
    render() {
        const { context={}, store, location='/', App } = this.props

        return (
            <Provider store={ store }>
                <StaticRouter location={ location } context={ context }>
                    <App />
                </StaticRouter>
            </Provider>
        )
    }
}
