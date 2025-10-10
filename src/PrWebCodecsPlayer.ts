import { DemuxerWorker } from './demuxer/DemuxerWorker'
import { DecoderWorker } from './decoder/DecoderWorker'
import { RenderWorker } from './render/RenderWorker'
import { AudioTransverter } from './audioTransverter/audioTransverter'

import { PrFetch } from 'pr-fetch'
import { CutOption } from './render/type'

export class PrWebCodecsPlayer {
  url: string | undefined

  prFetch = new PrFetch()

  demuxerWorker = new DemuxerWorker()
  decoderWorker = new DecoderWorker()
  renderWorker = new RenderWorker()

  audioTransverter = new AudioTransverter()

  // @ts-ignore
  audioContext = new (window.AudioContext || window.webkitAudioContext)()

  cutRenderWorker = new Map()

  canvas: HTMLCanvasElement | undefined

  onStream = (_stream: MediaStream) => {}
  onSEI = (_payload: Uint8Array) => {}

  constructor() {
    this.decoderWorker.audio.onDecode = (e) => {
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->decoderWorker.audio.onDecode: e`, e)
      this.audioTransverter.push(e)
      e.close()
    }
    this.decoderWorker.audio.onError = (e) => {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->decoderWorker.audio.onError: e`, e)
      this.stop()
    }

    this.decoderWorker.video.onDecode = (e) => {
      this.renderWorker.push(e)
      const keys = [...this.cutRenderWorker.keys()]
      for (const key of keys) {
        this.cutRenderWorker.get(key).push(e)
      }
    }
    this.decoderWorker.video.onError = (e) => {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->decoderWorker.video.onError: e`, e)
      this.stop()
    }
  }

  /**
   * 监听媒体 tag
   */
  onTag = (e: any) => {
    const { header, body } = e
    const { tagType, timestamp } = header
    // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: ${tagType}`, e)
    switch (tagType) {
      case 'script':
        {
          const { width, height } = body
          this.initRender({ width, height })
        }
        break
      case 'audio':
        {
          const { accPacketType, data } = body

          // 初始化解码器
          if (accPacketType === 0) {
            const { codec, sampleRate, channelConfiguration } = body
            const config: AudioDecoderConfig = { codec, sampleRate, numberOfChannels: channelConfiguration, description: new Uint8Array([]) }
            this.decoderWorker.audio.init(config)
          }
          // 解码
          else if (accPacketType === 1) {
            const type = 'key'
            this.decoderWorker.audio.decode({ type, timestamp: timestamp * 1, data })
          }
        }
        break
      case 'video':
        {
          const { avcPacketType, frameType, data, nalus = [] } = body

          // 初始化解码器
          if (avcPacketType === 0) {
            const { codec, data: description } = body
            this.decoderWorker.video.init({ codec, description })
          }
          // 解码
          else if (avcPacketType === 1) {
            const type = frameType === 1 ? 'key' : 'delta'
            this.decoderWorker.video.decode({ type, timestamp: timestamp * 1000, data })

            for (const nalu of nalus) {
              const { header, payload } = nalu
              const { nal_unit_type } = header
              // 解析SEI
              if (nal_unit_type === 6) {
                this.onSEI(payload)
              }
            }
          }
        }
        break
    }
  }

  /**
   * 初始化分离器
   */
  initDemuxer = () => {
    this.demuxerWorker.init()
    this.demuxerWorker.onTag = this.onTag
  }

  /**
   * 初始化渲染器
   * @param { width = 256, height = 256 } = {}
   * @returns
   */
  initRender = ({ width = 256, height = 256 } = {}) => {
    this.audioTransverter.init()
    const audioStream = this.audioTransverter?.getStream()

    if (!this.canvas) return
    this.canvas.width = width
    this.canvas.height = height
    const offscreenCanvas = this.canvas.transferControlToOffscreen()
    this.renderWorker.init(offscreenCanvas)
    const videoStream = this.canvas?.captureStream(25)

    const stream = new MediaStream()

    {
      const [track] = audioStream.getAudioTracks() || []
      track && stream.addTrack(track)
    }

    {
      const [track] = videoStream.getVideoTracks() || []
      track && stream.addTrack(track)
    }

    this.onStream && this.onStream(stream)
  }

  /**
   * 创建剪切
   */
  createCut = (key: string, cutOption: CutOption, canvas?: HTMLCanvasElement) => {
    if (!canvas) {
      canvas = document.createElement('canvas')
    }

    if (this.cutRenderWorker.has(key)) {
      this.cutRenderWorker.get(key).destroy()
    }

    const { sw, sh } = cutOption
    canvas.width = sw || canvas.width
    canvas.height = sh || canvas.height
    const offscreenCanvas = canvas.transferControlToOffscreen()
    const render = new RenderWorker()
    render.init(offscreenCanvas)
    render.setCut(cutOption)
    this.cutRenderWorker.set(key, render)

    return canvas
  }

  /**
   * 初始化
   * @param canvas?: HTMLCanvasElement
   */
  init = (canvas?: HTMLCanvasElement) => {
    this.stop()
    this.initDemuxer()
    if (!canvas) {
      canvas = document.createElement('canvas')
    }
    this.canvas = canvas
  }

  /**
   * 开始播放
   * @param url : string
   */
  start = async (url: string) => {
    try {
      const res = await this.prFetch.request(url)
      const reader = res.body?.getReader()
      if (!reader) throw new Error('Reader is error.')
      while (true) {
        const { done, value } = await reader.read()
        if (value) {
          this.demuxerWorker.push(value)
        }

        if (done) {
          break
        }
      }
    } catch (error) {
      // console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: error`, error)
    }
  }

  /**
   * 停止
   */
  stop = () => {
    this.prFetch.stop()
    this.demuxerWorker.destroy()
    this.decoderWorker.audio.destroy()
    this.decoderWorker.video.destroy()
    this.renderWorker.destroy()
    this.audioTransverter.destroy()
  }
}
