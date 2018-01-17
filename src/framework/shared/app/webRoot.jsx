/**
 * 应用入口
 *
 * @author : sunkeysun
 */

import React, { Component } from 'react'
import { combineReducers } from 'redux'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ConnectedRouter, routerReducer, routerMiddleware } from 'react-router-redux'
import configureStore from './store/configureStore'

import createHistory from 'history/createBrowserHistory'

const history = createHistory()
const middleware = routerMiddleware(history)

export default ({ App, rootReducer, rootSaga={} }) => {
    return (preloadedState) => {
        const combinedReducer = combineReducers({
            preloadedState: (state=preloadedState) => state,
            router: routerReducer,
        })

        const initialState = { preloadedState }

        const store = configureStore(combinedReducer, rootSaga, middleware)(initialState)

        return (
            <Provider store={ store }>
                <ConnectedRouter history={ history }>
                    <App />
                </ConnectedRouter>
            </Provider>
        )
    }
}
