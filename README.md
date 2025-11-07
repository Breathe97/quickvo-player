# 基于 pr-player 强化业务 SEI 对视频进行剪切渲染的能力。

## 立即开始

### 安装

```bash
npm i quickvo-player
```

### 引入

```js
import { QuickVoPlayer } from 'quickvo-player'
```

## 快速使用

```js
const player = new QuickVoPlayer()
player.on.users = (e) => {} // sei信息、streams

await player.start('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
player.setMute(false) // 默认都是静音 所以主动开启
const stream = player.getStream()
```

### 设置显示模式

```js
player.setDisplayMode('cut') // 'original' | 'cut'
```

## 代码仓库

[github](https://github.com/breathe97/pr-player)

## 贡献

breathe
