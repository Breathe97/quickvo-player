// 计算网络质量
const getNetworkQuality = (_lostRate: string, _roundTripTime: string, _jitter: string) => {
  const lostRate = Number(_lostRate)
  const roundTripTime = Number(_roundTripTime)
  const jitter = Number(_jitter)

  let quality: 0 | 1 | 2 | 3 | 4 | 5 = 0

  if (lostRate < 0.03 && roundTripTime < 100 && jitter < 0.05) {
    quality = 5
  } else if (lostRate < 0.06 && roundTripTime < 160 && jitter < 0.1) {
    quality = 4
  } else if (lostRate < 0.1 && roundTripTime < 250 && jitter < 0.15) {
    quality = 3
  } else if (lostRate < 0.15 && roundTripTime < 400 && jitter < 0.2) {
    quality = 2
  } else {
    quality = 1
  }
  return Number(quality)
}

export class PeerAnalyzeStats {
  pc: RTCPeerConnection | undefined

  // 通信网络质量
  network = {
    inboundBytes: 0, // 进站字节
    outboundBytes: 0, // 出战字节
    lostRate: '0.00', // 丢包率
    roundTripTime: '0', // 延迟
    jitter: '0', // 网络抖动
    quality: 0, // 网络质量
    averageQuality: 0, // 平均网络质量
    velocityPull: 0, //  平均进站速率
    velocityPush: 0 //  平均出站速率
  }

  reports: any[] = [] // 报告

  averageQualitys: number[] = [] // 平均网络质量集

  timer = 0 // 获取报告的定时器

  constructor() {}

  onNetwork = (_e: typeof this.network) => {}
  getNetwork = () => this.network
  getAverageQuality = () => this.network.averageQuality

  /**
   * start
   */
  start = (pc: RTCPeerConnection) => {
    this.stop()
    this.network = {
      inboundBytes: 0, // 进站字节
      outboundBytes: 0, // 出战字节
      lostRate: '0.00', // 丢包率
      roundTripTime: '0', // 延迟
      jitter: '0', // 网络抖动
      quality: 0, // 网络质量
      averageQuality: 0, // 平均网络质量
      velocityPull: 0, // 平均进站速率
      velocityPush: 0 // 平均出站速率
    }
    this.reports = []
    this.averageQualitys = []
    this.pc = pc
    clearInterval(this.timer)
    const func = async () => {
      // if (this.pc?.connectionState !== 'connected') return
      this.analyzeStats()
    }
    this.timer = window.setInterval(func, 1 * 1000)
  }

  analyzeStats = async () => {
    try {
      if (!this.pc) return

      const stats = await this.pc.getStats()
      const types = ['inbound-rtp', 'remote-inbound-rtp', 'outbound-rtp', 'transport', 'codec']
      const _reports = [...stats.values()]
      const reports = _reports.filter((item) => types.includes(item.type))

      let inboundBytes = 0 // 进站字节数
      let outboundBytes = 0 // 出站字节数

      let packetsSentBefore = 0 // 总发送包个数
      let packetsLostBefore = 0 // 总丢失包个数

      let packetsSentNow = 0 // 总发送包个数
      let packetsLostNow = 0 // 总丢失包个数

      let roundTripTimes = [] // 本次 往返耗时

      let jitters = [] // 本次 网络抖动

      for (const report of this.reports) {
        const { packetsSent, packetsLost } = report
        // 发送包数
        if (packetsSent) {
          packetsSentBefore += packetsSent
        }
        // 丢失包数
        if (packetsLost) {
          packetsLostBefore += packetsLost
        }
      }

      this.reports = reports // 记录新的报告

      for (const report of this.reports) {
        const { bytesSent, bytesReceived, packetsSent, packetsLost, roundTripTime, jitter } = report
        // 发送字节数
        if (bytesSent) {
          outboundBytes = bytesSent
        }
        // 接收字节数
        if (bytesReceived) {
          inboundBytes = bytesReceived
        }
        // 发送包数
        if (packetsSent) {
          packetsSentNow += packetsSent
        }
        // 丢失包数
        if (packetsLost) {
          packetsLostNow += packetsLost
        }
        // 往返时间
        if (roundTripTime) {
          roundTripTimes.push((roundTripTime * 100).toFixed(2))
        }
        // 抖动
        if (jitter) {
          jitters.push(jitter.toFixed(2))
        }
      }

      jitters.sort().reverse()
      roundTripTimes.sort().reverse()

      const packetsSentOffset = packetsSentNow - packetsSentBefore // 单位时间发送的包
      const packetsLostOffset = packetsLostNow - packetsLostBefore // 单位时间丢失的包

      // 丢包率
      const lostRate = packetsSentOffset === 0 ? '0.00' : Math.max(0, packetsLostOffset / packetsSentOffset).toFixed(2)
      const [roundTripTime = '0'] = roundTripTimes // 往返耗时
      const [jitter = '0'] = jitters // 网络抖动

      const quality = getNetworkQuality(lostRate, roundTripTime, jitter)

      let averageQuality, velocityPull, velocityPush

      // 更新平均网络质量
      {
        const length = 10
        this.averageQualitys.unshift(quality)
        this.averageQualitys = this.averageQualitys.slice(0, length) // 保留最新的10次
        averageQuality = this.averageQualitys.length === length ? Math.round(this.averageQualitys.reduce((a, b) => a + b) / this.averageQualitys.length) : 0
      }

      // 更新平均出站速率
      {
        velocityPull = inboundBytes - this.network.inboundBytes // 进站字节数差值
      }

      // 更新平均进站速率
      {
        velocityPush = outboundBytes - this.network.outboundBytes // 出站字节数差值
      }

      const obj = { outboundBytes, inboundBytes, lostRate, roundTripTime, jitter, quality, averageQuality, velocityPull, velocityPush }

      this.network = obj
      this.onNetwork(this.network)
    } catch (error) {
      console.log('\x1b[38;2;0;151;255m%c%s\x1b[0m', 'color:#0097ff;', `------->quickvo: analyzeStats is err.`, error)
    }
  }

  /**
   * getReports
   */
  getReports = async (mids: string[] = []) => {
    let arr = [...this.reports]

    if (mids.length !== 0) {
      arr = arr.filter((report) => mids.includes(report.mid))
    }

    return arr
  }

  /**
   * stop
   */
  stop = () => {
    clearInterval(this.timer)
  }
}
