/**
 * web 工具函数
 *
 * @author : sunkeysun
 */

export function downloadFile(fileName, content) {
    const aLink = document.createElement('a')
    const blob = new Blob([content])
    aLink.download = fileName
    aLink.href = URL.createObjectURL(blob)
    aLink.click()
}
