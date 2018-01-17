/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { Router, Route, browserHistory } from 'react-router'
import StaticRouter from 'react-router-dom/StaticRouter'
import { ConnectedRouter } from 'react-router-redux'

import configureStore from './store/configureStore'

export default ({ App, rootReducer={}, rootSaga={} }) => {
    return (initialState) => {
        const store = configureStore(rootReducer, rootSaga)(initialState)
        const context = {}

        return (
            <Provider store={ store }>
                <ConnectedRouter location={ '/' } context={ context }>
                    <App />
                </ConnectedRouter>
            </Provider>
        )
    }
}
