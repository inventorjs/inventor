/**
 * store 配置
 *
 * @author : sunkeysun
 */

import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

export default (rootReducer, rootSaga, middlewareExt) => {
    const sagaMiddleware = createSagaMiddleware()
    const middlewareArr = [sagaMiddleware]
    if (middlewareExt) {
        middlewareArr.push(middlewareExt)
    }

    const middleware = applyMiddleware(...middlewareArr)

    return (initialState={}) => {
        const store = createStore(
            rootReducer,
            initialState,
            middleware
        )

        sagaMiddleware.run(rootSaga)

        return store
    }
}
