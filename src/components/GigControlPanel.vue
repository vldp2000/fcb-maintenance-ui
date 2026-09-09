<template>
  <v-container grid-list-md text-md-center fluid class="darkBackgroud">
  <div class="selector-panel">
    <v-alert v-if="saveError" type="error" dense>{{ saveError }}</v-alert>
    <v-row md12 no-gutters>
      <v-col cols="12" md="4">
        <v-select
          dark
          v-if="gigList"
          label="Select Gig-2"
          v-model="gigId"
          :items="gigList"
          required
          item-text="name"
          item-value="id">
        </v-select>
      </v-col>
      <v-col cols="12" md="1">
        <div>
          <v-icon
            v-if="gigId>0"
            large
            v-bind:class="(checkIfGigIsCurrent()) ? 'defaultGigHighighted' : 'defaultGig'"
            @click="saveGigAsCurrent()"
          >
          grade
          </v-icon>
          <v-icon large class="clearGigBbutton"
            @click="clearGig()"
          >
          cancel
          </v-icon>
        </div>
      </v-col>
      <v-col cols="12" md="1">
        <div v-if="currentSongId>0">
           <metronome :bpm="tempo">
           </metronome>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <div v-if="currentSongList" class="currentSongSelector">
          <button class="currentSongNavButton" aria-label="Previous song" @click="selectPreviousSong()">
            <v-icon>mdi-chevron-double-left</v-icon>
          </button>
          <div
            class="currentSongButton"
            @click="openSongPicker()"
          >
            <div class="currentSongCaption">Current Song</div>
            <div class="currentSongValue">{{ currentSongDisplay }}</div>
          </div>
          <button class="currentSongNavButton" aria-label="Next song" @click="selectNextSong()">
            <v-icon>mdi-chevron-double-right</v-icon>
          </button>
        </div>
      </v-col>
       <v-col cols="12" md="2">
        <div class="songActionPanel">
          <v-btn
            small
            outlined
            color="light-blue lighten-2"
            class="historyButton"
            :disabled="currentSongId <= 0"
            @click="openHistory()"
          >
            <v-icon small left>history</v-icon>
            History
          </v-btn>
          <v-icon medium
            v-bind:class="(dataChanged) ? 'songActionButtonActive saveSongButtonHighighted' : 'songActionButtonInactive saveSongButton'"
            @click="saveSong()"
          >
          save
          </v-icon>
          <v-icon medium
            v-bind:class="(songReloadPending) ? 'songActionButtonActive selectSongButtonHighighted' : 'songActionButtonInactive selectSongButton'"
            @click="selectSong()"
          >
          settings_remote
          </v-icon>
        </div>
      </v-col>
    </v-row>
  </div>
  <div v-if="songPickerOpen" class="songPickerPanel">
    <div class="songPickerHeader">
      <div>
        <div class="songPickerCaption">Select Song</div>
        <div class="songPickerTitle">{{ songPickerSongs.length }} Songs</div>
      </div>
      <v-icon class="songPickerClose" @click="closeSongPicker()">close</v-icon>
    </div>
    <div class="songPickerGrid songPickerGridHeader">
      <div>ID</div>
      <div>Name</div>
      <div>Tempo</div>
      <div></div>
    </div>
    <div class="songPickerList">
      <div
        v-for="song in songPickerSongs"
        :key="song.id"
        class="songPickerGrid songPickerRow"
        v-bind:class="(song.id === currentSongId) ? 'songPickerRowSelected' : ''"
        @dblclick="chooseSong(song)"
      >
        <div class="songPickerId">{{ song.id }}</div>
        <div class="songPickerName">{{ song.name }}</div>
        <div class="songPickerTempo">{{ song.tempo }}</div>
        <button class="songPickerSelectButton" @click="chooseSong(song)">Select</button>
      </div>
    </div>
  </div>
  <v-dialog v-model="historyDialog" max-width="720px">
    <v-card dark class="historyDialog">
      <v-card-title class="headline">Song Preset History</v-card-title>
      <v-card-subtitle v-if="currentSong">
        {{ currentSong.id }}. {{ currentSong.name }}
      </v-card-subtitle>
      <v-card-text>
        <v-progress-linear v-if="historyLoading" indeterminate color="light-blue lighten-2"></v-progress-linear>
        <v-alert v-if="historyError" type="error" dense>{{ historyError }}</v-alert>
        <div v-if="!historyLoading && !historyError && historyRecords.length === 0" class="historyEmpty">
          No saved history for this song.
        </div>
        <v-radio-group v-if="!historyLoading && historyRecords.length > 0" v-model="selectedHistoryId">
          <v-list dark dense class="historyList">
            <v-list-item
              v-for="record in historyRecords"
              :key="record.id"
              class="historyRecord"
              @click="selectedHistoryId = record.id"
            >
              <v-list-item-action>
                <v-radio :value="record.id" color="light-blue lighten-2"></v-radio>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>{{ formatHistoryDate(record.savedAt) }}</v-list-item-title>
                <v-list-item-subtitle>{{ historyRecordSummary(record) }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="historyDialog = false">Cancel</v-btn>
        <v-btn color="light-blue lighten-2" text :disabled="!selectedHistoryId" @click="applyHistory()">
          Apply
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="unsavedChangesDialog" max-width="460px">
    <v-card dark class="unsavedChangesDialog">
      <v-card-title class="headline">Unsaved Changes</v-card-title>
      <v-card-text>
        {{ unsavedChangesMessage }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="light-blue lighten-2" text @click="unsavedChangesDialog = false">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
<!-------PROFRAM A----------->
    <v-row md12 ma-0 pa-0 no-gutters>

      <div id="Proram0" v-bind:class="(currentProgramIdx === 0) ? 'progLabelSelected' : 'progLabel'" @click="onProgramClick(0)">
        <h1>1</h1>
      </div>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 0) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(0, 0)'
            :programIdx=0
            :activeVolumePedal='checkVolumePedal1(0, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 0) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(0, 1)'
            :programIdx=0
            :activeVolumePedal='checkVolumePedal2(0, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 0) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(0, 2)'
            :programIdx=0
            :activeVolumePedal='checkVolumePedal1(0, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 0) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(0, 3)'
            :programIdx=0
            :activeVolumePedal='checkVolumePedal2(0, 2)'
            @changed="OnControlDataChanged($event)"/>
        </v-card>
      </v-col>
    </v-row>

<!-------PROFRAM B----------->
    <v-row md12 ma-0 pa-0 no-gutters>

      <div id="Proram1" v-bind:class="(currentProgramIdx === 1) ? 'progLabelSelected' : 'progLabel'" @click="onProgramClick(1)" >
        <h1>2</h1>
      </div>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 1) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(1, 0)'
            :programIdx=1
            :activeVolumePedal='checkVolumePedal1(1, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 1) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(1, 1)'
            :programIdx=1
            :activeVolumePedal='checkVolumePedal2(1, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 1) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(1, 2)'
            :programIdx=1
            :activeVolumePedal='checkVolumePedal1(1, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 1) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(1, 3)'
            :programIdx=1
            :activeVolumePedal='checkVolumePedal2(1, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>

    </v-row>
<!-------PROFRAM C----------->
    <v-row md12 ma-0 pa-0 no-gutters>

      <div id="Proram2"  v-bind:class="(currentProgramIdx === 2) ? 'progLabelSelected' : 'progLabel'" @click="onProgramClick(2)">
        <h1>3</h1>
      </div>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 2) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(2, 0)'
            :programIdx=2
            :activeVolumePedal='checkVolumePedal1(2, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 2) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
          :presetControlData='getPresetControlData(2, 1)'
          :programIdx=2
          :activeVolumePedal='checkVolumePedal2(2, 1)'
          @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 2) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(2, 2)'
            :programIdx=2
            :activeVolumePedal='checkVolumePedal1(2, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 2) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(2, 3)'
            :programIdx=2
            :activeVolumePedal='checkVolumePedal2(2, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
    </v-row>

<!-------PROFRAM D----------->
    <v-row md12 no-gutters>

      <div id="Proram3"  v-bind:class="(currentProgramIdx === 3) ? 'progLabelSelected' : 'progLabel'" @click="onProgramClick(3)">
        <h1>4</h1>
      </div>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 3) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(3, 0)'
            :programIdx=3
            :activeVolumePedal='checkVolumePedal1(3, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 3) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(3, 1)'
            :programIdx=3
            :activeVolumePedal='checkVolumePedal2(3, 1)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 3) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(3, 2)'
            :programIdx=3
            :activeVolumePedal='checkVolumePedal1(3, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
      <v-col md3 d-flex>
        <v-card  dark v-bind:class="(currentProgramIdx === 3) ? 'presetControlSelected' : 'presetControl'">
          <preset-control
            :presetControlData='getPresetControlData(3, 3)'
            :programIdx=3
            :activeVolumePedal='checkVolumePedal2(3, 2)'
            @changed="OnControlDataChanged($event)" />
        </v-card>
      </v-col>
    </v-row>
    <!-- <v-row md12 ma-0 pa-0 no-gutters>
      <v-btn large @click="btnClickPogram()" > change current program </v-btn>
      <v-btn large @click="btnClickSong()" > change current song </v-btn>
    </v-row> -->
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
// const config = require('@/config/config')
import Metronome from '@/components/globals/Metronome'
import SongsService from '@/services/SongsService'

export default {
  components: {
    Metronome
  },
  data () {
    return {
      // songId: 1,
      currentGig: null,
      currentSong: null,
      currentProgramIdx: 0,
      currentSongList: [],
      initFlag: true,
      dataChanged: false,
      saveError: '',
      songReloadPending: false,
      songPickerOpen: false,
      historyDialog: false,
      historyLoading: false,
      historyError: '',
      historyRecords: [],
      selectedHistoryId: null,
      unsavedChangesDialog: false,
      unsavedChangesMessage: '',
      currentPedal1Value: 1,
      currentPedal2Value: 1,
      isPlaying: false
    }
  },

  computed: {
    ...mapState(['presetList', 'instrumentList', 'instrumentBankList',
      'gigList', 'songList', 'currentSongId', 'currentProgramMidiPedal',
      'selectedGigId', 'scheduledGigId',
      'pedal1Value', 'pedal2Value',
      'allInitialized', 'instrumentListImagesInitialized',
      'refreshSong', 'refreshGigSongs', 'initialisingIsInProgress', 'defaultPreset']),
    songId: {
      get () {
        // this.$log.debug(` SongId GETTER is fired ---((( ${this.currentSongId}`)
        return this.currentSongId
      },
      set (value) {
        // this.$log.debug(` >>>> SongId setter  old=${this.currentSongId}  new=${value} `)
        if (this.currentSongId !== value && value > 0) {
          if (!this.canChangeSelection('Save the current song changes before selecting another song.')) {
            return
          }
          // this.$log.debug(` >>> SongId setter is fired ---))) -- ${value}`)
          this.$store.dispatch('setCurrentSongId', value)
        }
      }
    },
    gigId: {
      get () {
        return this.selectedGigId
      },
      set (value) {
        if (this.selectedGigId !== value && !this.canChangeSelection('Save the current song changes before selecting another gig.')) {
          return
        }
        this.$store.dispatch('setSelectedGigId', value)
      }
    },

    tempo: {
      get () {
        if (this.currentSong) return this.currentSong.tempo
        else return -1
      }
    },
    currentSongDisplay: {
      get () {
        if (!this.currentSong) return 'No song selected'
        const tempo = this.currentSong.tempo ? ` / ${this.currentSong.tempo} BPM` : ''
        return `${this.currentSong.id}. ${this.currentSong.name}${tempo}`
      }
    },
    songPickerSongs: {
      get () {
        if (this.currentSongList && this.currentSongList.length > 0) return this.currentSongList
        if (this.songList && this.songList.length > 0) return this.songList
        return []
      }
    }
  },

  watch: {
    allInitialized: async function () {
      if (this.allInitialized) {
        this.setGigSong()
        this.initFlag = false
      }
    },
    refreshSong: async function () {
      if (this.currentSongId > 0) {
        if (typeof this.songList !== 'undefined') {
          this.currentSong = this.songList.find(song => song.id === this.currentSongId)
          this.songId = this.currentSong.id
        }
      }
    },
    refreshGigSongs: async function (payload) {
      if (!payload || payload.gigId !== this.selectedGigId) {
        return
      }
      await this.reloadCurrentGigSongs()
    },
    selectedGigId: async function (id) {
      if (id > 0) {
        await this.reloadCurrentGigSongs()
      } else {
        if (this.songList && this.songList.length > 0) {
          this.currentSongList = this.songList
        }
      }
    },

    currentSongId: async function () {
      this.dataChanged = false
      this.songReloadPending = false
      this.songPickerOpen = false
      if (!this.currentSong || this.currentSong.id !== this.currentSongId) {
        this.setCurrentSong()
      }
    },

    currentProgramMidiPedal: function (idx) {
      this.currentProgramIdx = idx
    },
    pedal1Value: function () {
      this.currentPedal1Value = this.pedal1Value
    },
    pedal2Value: function () {
      this.currentPedal2Value = this.pedal2Value
    }
  },
  created () {
    this.initMessageSocket()
  },

  async mounted () {
    await this.initAllData()
    await this.initGigControlSelection()
  },

  methods: {
    OnControlDataChanged (change) {
      if (change && change.preset && this.currentSong && Array.isArray(this.currentSong.programList)) {
        const sameId = (left, right) => String(left) === String(right)
        const program = this.currentSong.programList[change.programIdx] ||
          this.currentSong.programList.find(item => sameId(item.id, change.preset.refsongprogram))
        const presetList = program && Array.isArray(program.presetList) ? program.presetList : []
        const preset = presetList.find(item => sameId(item.id, change.preset.id)) ||
          presetList.find(item => sameId(item.refinstrument, change.preset.refinstrument))

        if (!preset) {
          this.saveError = 'Could not apply the card changes to this song. Please reload the song and try again.'
          return
        }
        Object.assign(preset, change.preset)
      }
      this.dataChanged = true
      this.songReloadPending = false
      this.saveError = ''
    },

    async setCurrentSong () {
      const id = this.currentSongId
      if (this.currentSongList) {
        this.currentSong = this.currentSongList.find(item => item.id === id)
      }
      if (!this.currentSong && this.selectedGigId > 0) {
        if (this.currentGig && this.currentGig.songList && this.currentGig.songList.length > 0) {
          this.currentSong = this.currentGig.songList.find(item => item.id === id)
        }
      }

      if (!this.currentSong) {
        await this.setSongOutOfGig(id)
      }
      if (this.currentSong && !this.currentSong.programList) {
        await this.initSongPrograms(id)
      }
    },

    async setSongOutOfGig (id) {
      try {
        this.gigId = -1
        this.currentGig = null
        this.currentSong = this.songList.find(item => item.id === this.currentSongId)
      } catch (ex) {
        this.$log.error(ex)
      }
    },

    initMessageSocket () {
      try {
        this.$store.dispatch('socketClientInitialize', 'socketClientInitialize')
      } catch (ex) {
        this.$log.error(ex)
      }
    },

    selectSong () {
      try {
        this.$store.dispatch('selectSong', this.currentSongId)
        this.songReloadPending = false
      } catch (ex) {
        this.$log.error(ex)
      }
    },
    openSongPicker () {
      if (this.songPickerSongs.length > 0) {
        this.songPickerOpen = true
      }
    },
    closeSongPicker () {
      this.songPickerOpen = false
    },
    async openHistory () {
      if (!this.currentSong || this.currentSong.id <= 0) return

      this.historyDialog = true
      this.historyLoading = true
      this.historyError = ''
      this.historyRecords = []
      this.selectedHistoryId = null
      try {
        this.historyRecords = await SongsService.getSongPresetHistory(this.currentSong.id)
      } catch (ex) {
        this.$log.error(ex)
        this.historyError = 'Could not load song preset history.'
      } finally {
        this.historyLoading = false
      }
    },
    formatHistoryDate (savedAt) {
      const date = new Date(savedAt)
      return Number.isNaN(date.getTime()) ? savedAt : date.toLocaleString()
    },
    historyRecordSummary (record) {
      const programs = Array.isArray(record.programList) ? record.programList : []
      const presetCount = programs.reduce((count, program) =>
        count + (Array.isArray(program.presetList) ? program.presetList.length : 0), 0)
      return `${programs.length} programs, ${presetCount} presets`
    },
    applyHistory () {
      const record = this.historyRecords.find(item => item.id === this.selectedHistoryId)
      if (!record || !Array.isArray(record.programList) || !this.currentSong) return
      if (this.dataChanged && !confirm('Applying history will replace your current unsaved changes. Continue?')) return

      this.currentSong.programList = JSON.parse(JSON.stringify(record.programList))
      this.dataChanged = true
      this.songReloadPending = false
      this.historyDialog = false
    },
    async chooseSong (song) {
      if (song && song.id !== this.currentSongId && !this.canChangeSelection('Save the current song changes before selecting another song.')) {
        return
      }
      if (song && song.id > 0) {
        await this.$store.dispatch('setCurrentSongId', song.id)
        await this.$store.dispatch('selectSong', song.id)
      }
      this.songPickerOpen = false
    },
    async selectPreviousSong () {
      await this.selectAdjacentSong(-1)
    },
    async selectNextSong () {
      await this.selectAdjacentSong(1)
    },
    async selectAdjacentSong (direction) {
      const songs = this.songPickerSongs
      if (!songs || songs.length === 0) {
        return
      }

      const currentIndex = songs.findIndex(song => song.id === this.currentSongId)
      const startIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = (startIndex + direction + songs.length) % songs.length
      await this.chooseSong(songs[nextIndex])
    },
    canChangeSelection (message) {
      if (!this.dataChanged) {
        return true
      }
      this.showUnsavedChangesWarning(message)
      return false
    },
    showUnsavedChangesWarning (message) {
      this.unsavedChangesMessage = message
      this.unsavedChangesDialog = true
    },

    async getGigSongs (gig) {
      if (!gig || !gig.shortSongList || gig.shortSongList.length === 0) {
        return []
      }

      const songs = []
      for (const item of gig.shortSongList) {
        const song = this.songList.find(song => song.id === item.id)
        if (song) {
          songs.push(song)
        }
      }
      return songs
    },

    async reloadCurrentGigSongs () {
      const id = this.selectedGigId
      if (id <= 0 || typeof this.gigList === 'undefined') {
        return
      }

      this.currentGig = this.gigList.find(gig => gig.id === id)
      if (!this.currentGig) return

      const songs = await this.getGigSongs(this.currentGig)
      await this.$store.dispatch('populateGigSongs', { gigId: id, songs })
      this.currentSongList = songs
      this.currentSong = songs.length > 0 ? songs[0] : null
      if (songs.length > 0) {
        this.songId = songs[0].id
      } else {
        this.$store.dispatch('setCurrentSongId', -1)
      }
    },

    async initGigControlSelection () {
      if (this.selectedGigId > 0) {
        await this.reloadCurrentGigSongs()
        return
      }
      if (this.allInitialized) {
        await this.setGigSong()
      }
    },

    async setGigSong () {
      let gId = -1
      if (this.scheduledGigId > 0) {
        gId = this.scheduledGigId
      }
      if (gId > 0) {
        this.gigId = gId
      } else {
        this.gigId = -1
        this.songId = -1
      }
    },

    async initAllData () {
      try {
        if (!this.allInitialized && !this.initialisingIsInProgress) {
          await this.$store.dispatch('initAllLists', 'initAll')
        }
      } catch (ex) {
        this.$log.error(ex)
      }
    },

    getPresetControlData (programIndex, presetIndex) {
      try {
        if (typeof (this.currentSong) === 'undefined' || this.currentSong === null ||
          this.currentSongId === -1) {
          return this.defaultPreset
        } else {
          if (this.currentSong.programList === null ||
          typeof (this.currentSong.programList) === 'undefined') {
            return this.defaultPreset
          }
          const preset = {}
          Object.assign(preset, this.currentSong.programList[programIndex].presetList[presetIndex])
          return preset
        }
      } catch (ex) {
        this.$log.error(ex)
      }
    },
    getProgramTytle (idx) {
      if (this.currentSong && this.currentSong.programList) {
        return this.currentSong.programList[idx].tytle
      }
    },
    async initSongPrograms (songId) {
      this.$store.dispatch('addSongItems', songId)
    },

    onProgramClick (idx) {
      this.$store.dispatch('selectSongProgram', idx)
    },

    checkIfGigIsCurrent () {
      if (!this.currentGig) return false
      return (this.currentGig.id === this.scheduledGigId)
    },

    checkVolumePedal1 (program, pedal) {
      if (program === this.currentProgramIdx && pedal === this.currentPedal1Value) {
        return true
      } else {
        return false
      }
    },
    checkVolumePedal2 (program, pedal) {
      if (program === this.currentProgramIdx && pedal === this.currentPedal2Value) {
        return true
      } else {
        return false
      }
    },

    saveGigAsCurrent () {
      if (this.currentGig) {
        this.$store.dispatch('setGigAsScheduled', this.currentGig.id)
      }
    },
    clearGig () {
      if (!this.canChangeSelection('Save the current song changes before clearing the selected gig.')) {
        return
      }
      this.currentGig = null
      this.$store.dispatch('setSelectedGigId', -1)
    },
    async saveSong () {
      this.saveError = ''
      try {
        await this.$store.dispatch('updateSongPresets', this.currentSong)
        await this.$store.dispatch('selectSong', this.currentSongId)
        this.dataChanged = false
        this.songReloadPending = false
      } catch (ex) {
        this.$log.error(ex)
        this.saveError = 'Save failed. Your unsaved changes have been kept.'
        this.dataChanged = true
      }
    }
  }
}
</script>

<style  scoped>

.preset {
  margin: 5px;
}
.presetControl {
  padding: 4px;
  margin: 5px 9px;
  border: 2px solid transparent;
  width: calc(100% - 18px);
}
.presetControlSelected {
  position: relative;
  isolation: isolate;
  overflow: visible;
  padding: 4px;
  margin: 5px 9px;
  border: 4px solid #0b3f9f !important;
  background-color: rgba(8, 8, 10, 1) !important;
  background-clip: padding-box;
  box-shadow: 5px 6px 8px -2px rgba(35, 116, 221, 0.72) !important;
  width: calc(100% - 18px);
  /* box-shadow: 0px 1px 5px 0px; */
  /* color: blue !important; */
}

.presetControlSelected::after {
  content: none;
}

.darkBackgroud {
  /* background-color:rgba(50, 31, 119, 0.83) */
  background-color:rgba(12, 12, 12, 0.884)
}

.progLabel {
  text-align: center;
  text-justify: auto;
  color: #455a64;
  border: 2px solid #263238;
  background-color: rgba(8, 8, 10, 0.88);
  border-radius: 10px;

  width: 50px;
  height: 50px;
  /* margin: 50px, 10px, 0px, -10px; */
  margin-top: 38px;
  margin-left: -10px;
  margin-right: 2px;
  padding: 0px;
}

.progLabelSelected {
  position: relative;
  isolation: isolate;
  overflow: visible;
  text-align: center;
  text-justify: auto;
  color: #ffffff;
  border: 4px solid #0b3f9f !important;
  background-color: rgba(8, 8, 10, 1);
  background-clip: padding-box;
  box-shadow: 4px 5px 7px -2px rgba(35, 116, 221, 0.7) !important;
  border-radius: 10px;

  width: 50px;
  height: 50px;
  /* margin: 50px, 10px, 0px, -10px; */
  margin-top: 38px;
  margin-left: -10px;
  margin-right: 2px;
  padding: 0px;
}

.progLabelSelected::after {
  content: none;
}
.selector-panel {
  height: 52px;
}
.v-select  {
  color: azure;
  font-size: 20px;
  font-style: bold;
  text-shadow: 1px 1px 1px rgba(5, 79, 218, 0.83);
  text-transform: uppercase;
  font-weight: bold;
  margin: 0px;
  /* margin-bottom: -10px;
  margin-bottom: -20px; */
  margin-top: 0px;
  padding-bottom: 40px;
  padding-left: 60px;
  padding-right: 20px;
}

.currentSongSelector {
  display: flex;
  align-items: stretch;
  gap: 6px;
  height: 48px;
  margin: 0px 6px 0px 0px;
}
.currentSongButton {
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  padding: 3px 14px;
  color: azure;
  text-align: left;
  text-transform: uppercase;
  background-color: rgba(8, 8, 10, 0.88);
  border: 2px solid #263238;
  border-radius: 10px;
  box-shadow: none;
  cursor: pointer;
}
.currentSongNavButton {
  flex: 0 0 42px;
  height: 48px;
  color: #90caf9;
  font-size: 15px;
  font-weight: bold;
  background-color: rgba(8, 8, 10, 0.88);
  border: 2px solid #263238;
  border-radius: 10px;
  cursor: pointer;
}
.currentSongNavButton .v-icon {
  color: inherit;
}
.currentSongNavButton:hover {
  color: #ffffff;
  border-color: #0b3f9f;
  background-color: rgba(15, 38, 72, 0.88);
  box-shadow: 4px 5px 7px -2px rgba(35, 116, 221, 0.7);
}
.currentSongButton:hover {
  border-color: #0b3f9f;
  background-color: rgba(15, 38, 72, 0.88);
  box-shadow: 4px 5px 7px -2px rgba(35, 116, 221, 0.7);
}
.currentSongCaption {
  color: #b0bec5;
  font-size: 11px;
  font-weight: bold;
  line-height: 14px;
}
.currentSongValue {
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
  line-height: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 1px rgba(5, 79, 218, 0.83);
  white-space: nowrap;
}
.songPickerPanel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: 430px;
  max-width: 88vw;
  height: 100vh;
  padding: 14px 12px;
  color: #eceff1;
  background-color: rgba(9, 12, 17, 0.97);
  border-left: 3px solid #0b3f9f;
  box-shadow: -8px 0 16px -4px rgba(35, 116, 221, 0.62);
}
.songPickerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 12px 4px;
}
.songPickerCaption {
  color: #90a4ae;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}
.songPickerTitle {
  color: #ffffff;
  font-size: 28px;
  font-weight: bold;
  line-height: 32px;
}
.songPickerClose {
  color: #90caf9 !important;
  font-size: 32px !important;
}
.songPickerGrid {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 62px 76px;
  column-gap: 8px;
  align-items: center;
}
.songPickerGridHeader {
  padding: 8px 10px;
  color: #90a4ae;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(144, 202, 249, 0.28);
}
.songPickerList {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 6px 0 16px 0;
}
.songPickerRow {
  min-height: 44px;
  margin: 5px 0;
  padding: 5px 10px;
  color: #eceff1;
  background-color: rgba(26, 31, 38, 0.92);
  border: 1px solid rgba(69, 90, 100, 0.8);
  border-radius: 4px;
  cursor: pointer;
}
.songPickerRow:hover {
  border-color: rgba(35, 116, 221, 0.85);
  background-color: rgba(16, 34, 60, 0.94);
}
.songPickerRowSelected {
  border: 2px solid #0b3f9f;
  background-color: rgba(8, 8, 10, 1);
  box-shadow: 4px 5px 7px -2px rgba(35, 116, 221, 0.7);
}
.songPickerId,
.songPickerTempo {
  color: #cfd8dc;
  font-weight: bold;
}
.songPickerName {
  overflow: hidden;
  color: #ffffff;
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.songPickerSelectButton {
  min-width: 68px;
  height: 30px;
  color: #ffffff;
  font-weight: bold;
  background-color: rgba(11, 63, 159, 0.86);
  border: 1px solid rgba(144, 202, 249, 0.76);
  border-radius: 4px;
  cursor: pointer;
}
.songPickerSelectButton:hover {
  background-color: rgba(35, 116, 221, 0.94);
}
.unsavedChangesDialog {
  color: #eceff1;
  background-color: rgba(12, 16, 22, 0.98) !important;
  border: 2px solid #0b3f9f;
  box-shadow: 4px 5px 9px -2px rgba(35, 116, 221, 0.72);
}
.historyDialog {
  color: #eceff1;
  background-color: rgba(12, 16, 22, 0.98) !important;
  border: 2px solid #0b3f9f;
}
.historyList {
  max-height: 420px;
  overflow-y: auto;
  background-color: rgba(8, 12, 18, 0.86) !important;
}
.historyRecord {
  border-bottom: 1px solid rgba(144, 202, 249, 0.22);
}
.historyEmpty {
  padding: 24px 0;
  color: #b0bec5;
  text-align: center;
}

.songActionPanel {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
  min-width: 218px;
}
.historyButton {
  height: 48px !important;
  margin-top: 1px;
}
.songActionButtonInactive,
.songActionButtonActive {
  width: 44px;
  height: 48px;
  margin-left: 0px;
  margin-top: 1px;
  border-radius: 10px;
  border: 2px solid #263238;
  background-color: rgba(8, 8, 10, 0.88);
  font-size: 26px !important;
  flex: 0 0 44px;
}
.songActionButtonInactive {
  color: #455a64;
  box-shadow: none;
}
.songActionButtonActive {
  border: 4px solid #0b3f9f;
  background-color: rgba(8, 8, 10, 1);
  color: #ffffff;
  box-shadow: 4px 5px 7px -2px rgba(35, 116, 221, 0.7);
}
.saveSongButtonHighighted {
  color: #ffca28;
}
.saveSongButton {
  color: #455a64;
}
.selectSongButtonHighighted {
  color: #90caf9;
}
.selectSongButton {
  color: #455a64;
}
.defaultGigHighighted {
  margin-left: -4px;
  margin-top: 5px;
  color: #ffca28;
  font-size: 36px;
}
.defaultGig {
  margin-left: -4px;
  margin-top: 5px;
  color: #b0bec5;
  font-size: 36px;
}
.clearGigBbutton {
  margin-left: 4px;
  margin-top: 5px;
  color: #b0bec5;
  font-size: 36px;
}
.rotated {
  /* border: 1px solid red;
  writing-mode: sideways-lr;
  -webkit-writing-mode: sideways-lr;
  -ms-writing-mode: sideways-lr; */
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.v-avatar--metronome {
  animation-name: metronome-example;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
@keyframes metronome-example {
  from {
    transform: scale(.5);
  }
  to {
    transform: scale(1);
  }
}
</style>
