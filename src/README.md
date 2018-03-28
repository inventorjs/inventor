# Inventor - 全栈型现代 web 框架
基于 mvc 架构模式，借鉴众多优秀 php框架(CI, Laravel等)的设计思想，使用 koa2 作为 web 处理核心进行封装，对外暴露类 express 的接口及中间件书写方式(express 接口相对于 koa2 更加标准易用，故进行封装)，路由则借鉴了 Laravel 强大的路由系统，加入路由组的概念，提供更合理的路由规划方式。web 端则采用 react 的同构开发方式，做到前后端代码共用，以及良好的体验和更便捷的开发方式，业务代码完全不需要理解核心工作方式，只要遵循业务框架编写方式，即可构建项目。

### 中间件
框架将 koa2 的异步中间件包装成于 express 相同的尾递归中间件，更易于理解和使用，中间件采用静态类的方式，能够利用面向对象的优势。中间件的使用只要在相应路由定义时做配置即可，见路由配置。
```
import { Middleware } from 'inventor'

export default class DemoMiddleware extends Middleware {
    handle(request, response, next) {
        ...
        next()
    }
}
```

### 路由
路由系统借鉴 Laraval 路由系统对 koa-router 进行了封装，加入了 group 和 resource 路由的概念更加强大易用。采用 restfull 路由定义方式，更有效的控制资源。路由默认采用控制器方法的定义方式(controler@action)。
resource 路由会预定义资源操作的5个路由
```
    router.resource('/resource', 'ResourceController')
```
等同于定义了如下5个路由:
```
    router.post('/resource', 'ResourceController@add')             // 新增资源
    router.delete('/resource/:id', 'ResourceController@remove')    // 删除资源
    router.put('/resource/:id', `ResourceController@update')       // 更新资源
    router.get('/resource', 'ResourceController@list')             // 资源列表
    router.get('/resource/:id', 'ResourceController@query')        // 资源详情
```
group 路由会自动为子路由添加路由前缀，以及一些公共选项(如 中间件，自定义参数) 即路由定义的第三个参数(支持 middlewares 和 locals)
```
    router.group('/group', (router) => {
        router.get('/test', 'TestController@list')
    }, { middlewares: [ DemoMiddleware ], locals: { routeId: 123 } })
```
这样子路由就都会应用中间件 DemoMiddleware 并且传递 locals 变量，route 数据会挂在 request 上面(获取 request.route)

### 控制器
控制器采用标准类定义方式，自动将 reqeust 和 response 挂在 this 上，可以直接使用，启用 request 和 response 支持的接口，可参考 express4 接口。

### 模型
框架将模型定义为IO适配层，分为2种(接口模型和DB模型)
其中接口模型需要用 interfaceModel 装饰器进行装饰，并且把接口配置传给装饰器，装饰器会根据接口配置自动生成请求代码。接口模型提供了 _packData 函数可复写，用来更改打包协议。

### 请求对象
框架前后端请求对 axios 进行一层封装，使其更加易用，并且自动注入请求序列号，便于追踪，支持请求竞态处理，和通用请求拦截器配置。框架将请求服务对象挂在了全局的 app().request 对象上，由于框架对于请求用 requestModel 进行了良好的封装，业务层代码不需要接触到该请求对象，各种请求参数都是通过配置文件及参数进行配置，简化了调用方式。
