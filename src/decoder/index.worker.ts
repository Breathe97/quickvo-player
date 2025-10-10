import { Decoder } from './Decoder'

interface WorkerMessage {
  type: 'audio' | 'video'
  action: 'init' | 'decode' | 'flush' | 'destroy'
  data: any
}

const decoder = new Decoder()

decoder.audio.onDecode = (data) => postMessage({ type: 'audio', action: 'onDecode', data })
decoder.audio.onError = (data) => postMessage({ type: 'audio', action: 'onError', data })

decoder.video.onDecode = (data) => postMessage({ type: 'video', action: 'onDecode', data })
decoder.video.onError = (data) => postMessage({ type: 'video', action: 'onError', data })

onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, action, data } = event.data
  const func = decoder[type][action]
  func && func(data)
}
