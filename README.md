# onebot-lb

[OneBot](https://onebot.dev/) 负载均衡器。`onebot-lb` 对每个路由连接1个 Bot 后端，接收来自多个 app 后端的连接，并对来自 Bot 的信息或事件负载均衡，转发 app 后端要发送给 Bot 的消息。

`onebot-lb` 为高可用以及规模化的 OneBot 应用打造。

`onebot-lb` 目前支持 OneBot v11 的双向 WebSockets 作为应用后端，以及全部连接方式作为 Bot 后端。

## 配置

参考项目的 `config.example.yaml` ，并复制成为 `config.yaml` 以运行。

```yaml
host: 'localhost' # 监听地址
port: 3000 # 监听端口
# OntBot 后端配置。
## 配置模式请参照 [Koishi 文档](https://koishi.js.org/v4/plugins/adapter/onebot.html#%E6%9C%BA%E5%99%A8%E4%BA%BA%E9%80%89%E9%A1%B9)
onebot:
  path: /onebot # http 或反向 WebSocket 监听路径
  secret: 'secret' # 接收信息时用于验证的字段，应与 OneBot 的 `secret` 配置保持一致。
  bots:
    - protocol: 'ws' # 可选值: http, ws, ws-reverse
      endpoint: 'ws://localhost:6700' # http 或正向 WebSocket 连接地址
      selfId: '1111111111' # 机器人 id
      token: 'token' # 发送信息时用于验证的字段。
# app 后端路由配置。
## app 后端只支持正向和反向 WebSocket
## 对于每个消息或事件，负载均衡器会发给所有路由的依照策略的某一个连接。
routes:
  - name: default # 必填。路由名称。机器人连接的 ws 路径为 ws://<地址>/routes/<name>
    selfId: '3221204940' # 必填。机器人 ID，和 OneBot 配置的 selfId 一致
    token: 'token' # 连接 token
    # 分流策略，有 'broadcast' | 'random' | 'round-robin' | 'hash' 四种。
    ## 分别为『广播给所有连接』『随机连接』『轮询』『按会话 hash』
    ## 默认为 hash。在有机器人交互的应用中建议使用 hash
    balancePolicy: hash
    select: false # 作用域，详见 [Koishi 文档](https://koishi.js.org/v4/guide/plugin/context.html#%E5%9C%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8%E9%80%89%E6%8B%A9%E5%99%A8)
    heartbeat: 3000 # 心跳包的间隔。0 或不填为禁用心跳包。
    readonly: false # 该路由是否为只读。只读路由的连接无法对机器人进行写操作，只会得到模拟响应，但是可以进行 get 操作以及接收事件。
    rateLimitInterval: 500 # 限速调用间隔，默认 500ms。
    wsReverse: # 该路由的反向 WebSocket 配置。可以配置多个。
      - endpoint: 'ws://localhost:8080'
        token: 'token'
        reconnectInterval: 60000 # 重连间隔
```

## Docker

Docker 容器镜像位于 `git-registry.mycard.moe/3rdeye/onebot-lb`。使用时把 `config.yaml` 挂载到 `/usr/src/app/config.yaml` 即可。

## 运行

### http 路径

* `/onebot` OneBot 后端 (http 或反向 WebSocket) 连接的路径。

* `/route/<app name>` app 后端连接的路径。

### 分流策略

`onebot-lb` 支持4种负载均衡分流策略，在 `routes` 的 `balancePolicy` 进行设定该路由的分流策略。

#### broadcast

该模式下，所有消息和事件会发给该路由的每一个连接。这种情况下，每个路由可能会重复收到消息。

#### random

该模式下，所有消息和事件会随机发送给某一个 app 后端连接。

#### round-robin

该模式下，所有消息和事件会依次轮流发送给某一个 app 后端连接。

#### hash

该模式下，消息和事件会依照消息类型，机器人 ID，用户 ID 以及群号等信息进行 hash，并确定发送的目标 app 后端连接。

该模式是默认分流策略，推荐在有机器人交互的环境下使用。

## LICENSE

MIT