const convertToAudioBuffer = async (audioContext: AudioContext, audioData: AudioData) => {
  const audioBuffer = audioContext.createBuffer(audioData.numberOfChannels, audioData.numberOfFrames, audioData.sampleRate)

  for (let channel = 0; channel < audioData.numberOfChannels; channel++) {
    const planeSize = audioData.allocationSize({ planeIndex: channel })
    const data = new Uint8Array(planeSize)
    audioData.copyTo(data, { planeIndex: channel })

    // 假设是 16-bit PCM 数据
    const view = new DataView(data.buffer)
    const channelData = audioBuffer.getChannelData(channel)

    for (let i = 0; i < audioData.numberOfFrames; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768.0
    }
  }
  return audioBuffer
}

export class AudioTransverter {
  audioContext: AudioContext | undefined
  destination: MediaStreamAudioDestinationNode | undefined
  stream = new MediaStream()
  nextStartTime = 0
  pendingSources: AudioBufferSourceNode[] = []

  constructor() {}

  init = () => {
    // @ts-ignore
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.destination = this.audioContext.createMediaStreamDestination()
    this.stream.addTrack(this.destination.stream.getAudioTracks()[0])
    this.nextStartTime = 0
    this.pendingSources = []
    return this.stream
  }

  async push(audioData: AudioData) {
    try {
      if (!this.audioContext) return
      if (!this.destination) return

      // 1. 转换 AudioData 为 AudioBuffer
      const audioBuffer = await convertToAudioBuffer(this.audioContext, audioData)

      if (!audioBuffer) return

      // 2. 创建播放源
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.destination)

      // 3. 计算精确播放时间
      const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime)
      this.nextStartTime = startTime + audioBuffer.duration

      // 4. 调度播放
      source.start(startTime)
      this.pendingSources.push(source)

      // 5. 自动清理
      source.onended = () => {
        this.pendingSources = this.pendingSources.filter((s) => s !== source)
      }

      // 6. 处理首次播放
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } finally {
      audioData.close()
    }
  }

  getStream = () => this.stream

  destroy() {
    this.audioContext?.close()
    this.audioContext = undefined
    this.destination = undefined
    this.nextStartTime = 0
    this.pendingSources.forEach((source) => source.stop())
    this.pendingSources = []
  }
}
