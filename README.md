# onebot-lb

[OneBot](https://onebot.dev/) 负载均衡器。

目前支持 OneBot v11 的双向 WebSockets 作为应用后端，以及全部连接方式作为 Bot 后端。

## 配置

参考项目的 `config.example.yaml` ，并复制成为 `config.yaml` 以运行。

## Docker

Docker 容器镜像位于 `git-registry.mycard.moe/3rdeye/onebot-lb`。使用时把 `config.yaml` 挂载到 `/usr/src/app/config.yaml` 即可。