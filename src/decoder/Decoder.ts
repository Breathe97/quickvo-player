export class Decoder {
  private audioDecoderConfig: AudioDecoderConfig | undefined
  private audioDecoder: AudioDecoder | undefined

  private videoDecoderConfig: VideoDecoderConfig | undefined
  private videoDecoder: VideoDecoder | undefined

  private hasKeyFrame = false

  onDecode = (_frame: { img: ImageBitmap; timestamp: number }) => {}
  onError = (_e: DOMException) => {}

  constructor() {}

  initAudio = async (_config: AudioDecoderConfig) => {
    this.destroy(['audio'])
    this.audioDecoderConfig = { ..._config }
    this.audioDecoder = new AudioDecoder({
      output: async (data: AudioData) => {
        console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: data`, data)
      },
      error: (e) => {
        this.onError && this.onError(e)
      }
    })

    const { config, supported = false } = await AudioDecoder.isConfigSupported(this.audioDecoderConfig)
    console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: supported`, supported)
    if (supported && config) {
      // this.audioDecoder.configure(config)
    }
  }

  initVideo = async (_config: VideoDecoderConfig) => {
    this.destroy(['video'])
    this.videoDecoderConfig = { ..._config }
    this.videoDecoder = new VideoDecoder({
      output: async (frame: VideoFrame) => {
        const img = await createImageBitmap(frame)
        const timestamp = frame.timestamp
        frame.close()
        if (img.width > 0 && img.height > 0) {
          this.onDecode && this.onDecode({ img, timestamp })
        } else {
          img.close()
        }
      },
      error: (e) => {
        this.onError && this.onError(e)
      }
    })
    const { config, supported = false } = await VideoDecoder.isConfigSupported(this.videoDecoderConfig)
    if (supported && config) {
      this.videoDecoder.configure(config)
    }
  }

  decodeAudio = async (init: EncodedAudioChunkInit) => {
    console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->Breathe: init`, init)
  }

  decodeVideo = async (init: EncodedVideoChunkInit) => {
    if (!this.videoDecoder) return
    if (init.type === 'key') {
      this.hasKeyFrame = true
    }
    if (this.hasKeyFrame && this.videoDecoder.decodeQueueSize < 2) {
      const chunk = new EncodedVideoChunk(init)
      this.videoDecoder.decode(chunk)
    }
  }

  destroy = (types: Array<'audio' | 'video'> = ['audio', 'video']) => {
    if (types.includes('audio')) {
      this.audioDecoderConfig = undefined
      this.audioDecoder?.close()
      this.audioDecoder = undefined
    }

    if (types.includes('video')) {
      this.videoDecoderConfig = undefined
      this.videoDecoder?.close()
      this.videoDecoder = undefined
      this.hasKeyFrame = false
    }
  }

  flush = () => {
    this.videoDecoder?.flush()
  }
}
