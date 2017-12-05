/**
 * 基础服务提供类
 *
 * @author : sunkeysun
 */

export default class ServiceProvider {

    @abstruct
    register() {
        if (this.constructor === ServiceProvider) {
            throw new IException()
        }
    }
}
