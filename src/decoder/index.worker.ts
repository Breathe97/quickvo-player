import { Decoder } from './Decoder'

interface WorkerMessage {
  action: 'initAudio' | 'initVideo' | 'decodeAudio' | 'decodeVideo' | 'flush' | 'destroy'
  data: any
}

const decoder = new Decoder()

decoder.onDecode = (data) => postMessage({ action: 'onDecode', data })
decoder.onError = (data) => postMessage({ action: 'onError', data })

onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { action, data } = event.data
  const func = decoder[action]
  func && func(data)
}
