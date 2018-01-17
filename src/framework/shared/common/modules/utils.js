/**
 * 工具函数
 *
 * @author : sunkeysun
 */

export function createAction(baseAction) {
    const action = (payload) => { return { type: baseAction, payload: payload } }
    action.type = baseAction
    return action
}

export function createRequestAction(baseAction) {
    const actionObj = createAction(baseAction)

    _.reduce(['REQUEST', 'SUCCESS', 'FAILURE'], (result, action) => {
        return _.extend(result, { [action]: `${baseAction}_${action}`})
    }, actionObj)

    return actionObj
}
