/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { Provider } from 'mobx-react'
import { Router, Route } from 'react-router-dom'

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
