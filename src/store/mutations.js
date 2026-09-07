import Vue from 'vue'
import * as types from './mutation-types'

function assignOrAdd (list, value) {
  const item = list.find(item => item.id === value.id)
  if (item) Object.assign(item, value)
  else list.push(value)
}

const mutations = {
  [types.INIT_ALL] (state) {
    state.allInitialized = true
  },
  [types.INIT_INPROGRESS] (state, value) {
    state.initialisingIsInProgress = value
  },
  [types.SET_SONGLIST] (state, songList) {
    state.songList = songList
  },
  [types.ADD_SONG] (state, song) {
    assignOrAdd(state.songList, song)
  },
  [types.UPDATE_SONG] (state, song) {
    assignOrAdd(state.songList, song)
  },
  [types.REFRESH_SONG] (state) {
    state.refreshSong = !state.refreshSong
  },
  [types.REFRESH_GIG_SONGS] (state, gigId) {
    state.refreshGigSongs = {
      gigId,
      sequence: state.refreshGigSongs.sequence + 1
    }
  },
  [types.ADD_SONG_ITEMS] (state, songPrograms) {
    const song = state.songList.find(song => song.id === songPrograms.songId)
    if (song && !song.programList) Vue.set(song, 'programList', songPrograms.programs)
  },
  [types.UPDATE_SONGPROGRAMPRESET] (state, payload) {
    const song = state.songList.find(song => song.id === payload.refsong)
    const program = song && song.programList.find(program => program.id === payload.refsongprogram)
    const preset = program && program.presetList.find(preset => preset.id === payload.id)
    if (!preset) return
    Object.assign(preset, {
      refpreset: payload.refpreset,
      volume: payload.volume,
      pan: payload.pan,
      muteflag: payload.muteflag,
      reverbflag: payload.reverbflag,
      delayflag: payload.delayflag,
      modeflag: payload.modeflag,
      reverbvalue: payload.reverbvalue,
      delayvalue: payload.delayvalue
    })
    Vue.set(preset, 'boostflag', payload.boostflag || 0)
  },
  [types.UPDATE_SONGPROGRAM] (state, songProgram) {
    const song = state.songList.find(song => song.id === songProgram.refsong)
    const program = song && song.programList.find(program => program.id === songProgram.id)
    if (program) program.tytle = songProgram.tytle
  },
  [types.SET_INSTRUMENTLIST] (state, instrumentList) {
    state.instrumentList = instrumentList
  },
  [types.ADD_INSTRUMENT] (state, instrument) {
    state.instrumentList.push(instrument)
  },
  [types.UPDATE_INSTRUMENT] (state, instrument) {
    assignOrAdd(state.instrumentList, instrument)
  },
  [types.SET_INSTRUMENT_IMAGE] (state, payload) {
    payload.forEach(item => {
      const instrument = state.instrumentList.find(instrument => instrument.id === item.id)
      if (instrument && !instrument.imageURL) Vue.set(instrument, 'imageURL', item.url)
    })
  },
  [types.SET_PRESETLIST] (state, presetList) {
    state.presetList = presetList
  },
  [types.ADD_PRESET] (state, preset) {
    state.presetList.push(preset)
  },
  [types.UPDATE_PRESET] (state, preset) {
    assignOrAdd(state.presetList, preset)
  },
  [types.DELETE_PRESET] (state, presetId) {
    const index = state.presetList.findIndex(item => item.id === presetId)
    if (index > -1) state.presetList.splice(index, 1)
  },
  [types.SET_INSTRUMENTBANKLIST] (state, instrumentBankList) {
    state.instrumentBankList = instrumentBankList
  },
  [types.ADD_INSTRUMENTBANK] (state, instrumentBank) {
    state.instrumentBankList.push(instrumentBank)
  },
  [types.UPDATE_INSTRUMENTBANK] (state, instrumentBank) {
    assignOrAdd(state.instrumentBankList, instrumentBank)
  },
  [types.SET_GIGLIST] (state, gigList) {
    state.gigList = gigList
  },
  [types.ADD_GIG] (state, gig) {
    state.gigList.push(gig)
  },
  [types.UPDATE_GIG] (state, gig) {
    assignOrAdd(state.gigList, gig)
  },
  [types.POPULATE_GIG_SONGS] (state, payload) {
    const gig = state.gigList.find(gig => gig.id === payload.gigId)
    if (gig) Vue.set(gig, 'songList', payload.songs)
  },
  [types.SET_GIGSONGLIST] (state, gigSongList) {
    state.gigSongList = gigSongList
  },
  [types.ADD_GIGSONG] (state, gigsong) {
    state.gigSongList.push(gigsong)
  },
  [types.UPDATE_GIGSONG] (state, gigsong) {
    assignOrAdd(state.gigSongList, gigsong)
  },
  [types.SET_SCHEDULEDGIG_ID] (state, id) {
    state.scheduledGigId = id
  },
  [types.SET_SELECTEDGIG_ID] (state, id) {
    state.selectedGigId = id
  },
  [types.SET_CURRENTSONG_ID] (state, id) {
    state.currentSongId = id
  },
  [types.SET_CURRENT_PROGRAMMIDIPEDAL] (state, idx) {
    state.currentProgramMidiPedal = idx
  },
  [types.SET_PEDAL1VALUE] (state, value) {
    state.pedal1Value = value
  },
  [types.SET_PEDAL2VALUE] (state, value) {
    state.pedal2Value = value
  },
  [types.SET_PRESET_VOLUME_BY_CONTROLLER] (state, volume) {
    state.presetVolumeFromController = volume
  }
}

export default mutations
