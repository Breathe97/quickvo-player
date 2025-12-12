## 快速使用

```js
const player = new QuickVoPlayer()
player.on.users = (e) => {} // sei信息、streams

await player.start('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
player.setMute(false) // 默认都是静音 所以主动开启
const stream = player.getStream()

// 拿到所需要的 stream 然后进行渲染 (这里以原生js使用方式作为参考)
document.querySelector<HTMLVideoElement>('#my-dom-view')?.srcObject = stream


```

### 设置显示模式

```js
player.setDisplayMode('cut') // 'original' | 'cut'
```
