<template>
  <v-container grid-list-md text-md-center fluid class="metronome">
    <button
      class="metronomeButton"
      v-bind:class="getMetronomeButtonClass()"
      @click="toggleRunning"
    >
      <v-icon
        large
        class="playButton"
        v-bind:class="getMetronomeColor()"
      >
        {{ running ? 'mdi-record' : 'mdi-play-circle-outline' }}
      </v-icon>
    </button>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      running: false,
      count: 0,
      timerId: null
    }
  },
  props: {
    bpm: {
      type: [Number, String],
      default: -1
    },
    timeSignature: {
      type: [String],
      default: '4/4'
    }
  },

  computed: {
    interval () {
      const bpm = Number(this.bpm)
      if (!Number.isFinite(bpm) || bpm <= 0) return 0
      return (60 * 1000) / (bpm * (this.measure / 4))
    },
    beats () {
      const beats = Number(this.timeSignature.split('/')[0])
      return Number.isFinite(beats) && beats > 0 ? beats : 4
    },
    measure () {
      const measure = Number(this.timeSignature.split('/')[1])
      return Number.isFinite(measure) && measure > 0 ? measure : 4
    }
  },
  watch: {
    bpm: 'reset',
    beats: 'reset',
    measure: 'reset'
  },
  beforeDestroy () {
    this.stopTimer()
  },
  methods: {
    toggleRunning () {
      if (this.running) {
        this.stop()
        return
      }
      this.start()
    },
    start () {
      if (this.interval <= 0) return
      this.running = true
      this.count = 0
      this.tick()
      this.timerId = setInterval(this.tick, this.interval)
    },
    stop () {
      this.running = false
      this.count = 0
      this.stopTimer()
    },
    reset () {
      if (!this.running) {
        this.count = 0
        return
      }
      this.stopTimer()
      this.count = 0
      if (this.interval > 0) {
        this.tick()
        this.timerId = setInterval(this.tick, this.interval)
      } else {
        this.running = false
      }
    },
    tick () {
      if (!this.running) {
        return
      }
      this.count = (this.count % this.beats) + 1
    },
    stopTimer () {
      if (this.timerId) {
        clearInterval(this.timerId)
        this.timerId = null
      }
    },
    getMetronomeColor () {
      if (!this.running) {
        return 'inactiveBeat'
      }
      if (this.isGreenBeat()) {
        return 'greenBeat'
      }
      return 'blackBeat'
    },
    getMetronomeButtonClass () {
      if (!this.running) return ''
      return this.isGreenBeat() ? 'metronomeButtonGreenBeat' : 'metronomeButtonBlackBeat'
    },
    isGreenBeat () {
      return this.count % 2 === 1
    }
  }
}
</script>

<style scoped>

  .metronome {
    padding: 0;
    margin: 0;
  }
  .metronomeButton {
    width: 48px;
    height: 48px;
    margin-left: 10px;
    margin-top: -3px;
    padding: 0;
    background-color: rgba(8, 8, 10, 0.88);
    border: 2px solid #263238;
    border-radius: 50%;
    cursor: pointer;
  }
  .metronomeButtonGreenBeat {
    border-color: #1f7f46;
    box-shadow: none;
  }
  .metronomeButtonBlackBeat {
    border-color: #0b3f9f;
    box-shadow: 4px 5px 8px -2px rgba(35, 116, 221, 0.82);
  }
  .playButton {
    margin-top: -1px;
  }
  .input-group label {
    transition: none !important;
  }

  .input-group__details:before {
    transition: none !important;
  }

  .inactiveBeat {
    color: rgb(103, 103, 109);
  }
  .greenBeat {
    color: #50d178;
  }
  .blackBeat {
    color: #050608;
  }
</style>
