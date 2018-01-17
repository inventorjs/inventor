/**
 * session 处理助手
 *
 * @author : sunkeysun
 */

export function serialize(data) {
    const resultData = JSON.stringify(data)
    return resultData
}

export function unserialize(data) {
    let resultData = null
    try {
        resultData = JSON.parse(data)
    } catch(err) {
    }

    return resultData
}
