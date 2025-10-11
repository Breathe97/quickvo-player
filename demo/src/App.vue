<template>
  <div>
    <div style="font-size: 30px; line-height: 60px">WebCodecsPlayer</div>
    <div style="margin: 8px 0; display: flex; gap: 12px; justify-content: center">
      <input style="padding: 6px; width: 320px" id="input" type="text" v-model="url" placeholder="https://xxxx.flv" />
      <button @click="changeUrl">Other</button>
      <button @click="play">Start</button>
      <button @click="stop">Stop</button>
      <button @click="cut">Cut</button>
    </div>
    <div class="play-view">
      <div class="canvas-video-frame">
        <div class="title">VideoFrame</div>
        <div id="canvas-view" style="background-color: antiquewhite"></div>
      </div>
      <div class="video-media-stream">
        <div class="title">To MediaStream</div>
        <div id="video-view" style="background-color: brown"></div>
      </div>
    </div>
    <div class="play-view">
      <div class="video-media-cut-stream">
        <div class="title">Cut To MediaStream</div>
        <div id="video-view-cut" style="background-color: dimgray"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { QuickVoPlayer } from '../../src/index'

const url = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
const info = ref()

const player = new QuickVoPlayer()

player.on.demuxer.script = (e) => {
  info.value = e.body
}

player.on.stream = async (stream) => {
  const video_view = document.querySelector('#video-view')
  if (!video_view) return

  const video_dom = document.createElement('video')
  video_dom.style.width = '100%'
  video_dom.style.height = '100%'
  video_view.replaceChildren(video_dom)

  video_dom.srcObject = stream
  video_dom.muted = false
  video_dom?.load()
  await nextTick()
  video_dom?.play()
}

player.on.cutStream = async (id, stream) => {
  const video_view = document.querySelector('#video-view-cut')
  if (!video_view) return
  const video_dom = document.createElement('video')
  video_dom.style.width = '100%'
  video_dom.style.height = '100%'
  video_view.appendChild(video_dom)
  video_dom.srcObject = stream
  video_dom?.load()
  await nextTick()
  video_dom?.play()
}

const init = async () => {
  await nextTick()

  const canvas_view = document.querySelector('#canvas-view')

  if (!canvas_view) return

  const canvas_dom = document.createElement('canvas')
  canvas_dom.style.height = '100%'
  canvas_view.replaceChildren(canvas_dom)

  player.init(canvas_dom)

  await new Promise((resolve) => setTimeout(() => resolve(true), 1000))
}

const changeUrl = () => {
  url.value = 'https://stream.quickvo.live/stream_6873370840/1760098541294.flv?auth_key=1760184941-0-0-4d81eb8e9e1d9f78cbc0fc0bce3ebd3c'
}

const play = async () => {
  await init()
  player.start(url.value)
}

const cut = () => {
  const canvas_dom = document.createElement('canvas')
  canvas_dom.style.height = '100%'
  const { width, height } = info.value
  const video_view = document.querySelector('#video-view-cut')

  if (!video_view) return

  while (video_view.firstChild) {
    video_view.firstChild.remove()
  }

  video_view.appendChild(canvas_dom)

  player.createCut('cut-1', { sx: width * 0.25, sy: height * 0.25, sw: width * 0.3, sh: height * 0.3 }, canvas_dom)
}

const stop = () => {
  player.stop()
}
</script>
<style scoped>
.play-view {
  position: relative;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 12px;
}

.canvas-video-frame,
.video-media-stream {
  flex: 1;
  min-width: 320px;
  max-width: 600px;
  aspect-ratio: 16/9;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-media-cut-stream {
  flex: 1;
  min-width: 320px;
  max-width: min-content;
  aspect-ratio: 16/9;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 20px;
  line-height: 40px;
}

#canvas-view canvas {
  height: 100%;
}

#canvas-view,
#video-view,
#video-view-cut {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
