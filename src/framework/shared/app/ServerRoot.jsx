/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { Provider } from 'mobx-react'
import { StaticRouter as Router, Route } from 'react-router-dom'

export default class extends Component {
    render() {
        const { context={}, store, location='/', App } = this.props

        return (
            <Provider store={ store }>
                <Router location={ location } context={ context }>
                    <Route component={ App } />
                </Router>
            </Provider>
        )
    }
}
