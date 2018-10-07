/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import createBrowserHistory from 'history/createBrowserHistory'
import { Provider } from 'mobx-react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

export default class extends Component {
    render() {
        const { store, history, App } = this.props

        return (
            <Provider store={ store }>
                <Router history={ history }>
                    <Route component={ App } />
                </Router>
            </Provider>
        )
    }
}
