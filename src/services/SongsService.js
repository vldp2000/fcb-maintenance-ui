import Api from '@/services/Api'

export default {
  async getAllData () {
    const result = await Api().get('all/song')
    return result.data
  },
  async getId () {
    const result = await Api().get('id/song')
    return result.data.id
  },
  async getSongItems (songId) {
    const result = await Api().get(`song/${songId}`)
    return {
      songId,
      programs: result.data.programList || []
    }
  },

  async getSongPresetHistory (songId) {
    const result = await Api().get(`history/songpresets/${songId}`)
    return result.data
  },

  async putSong (song) {
    const songObj = Object.assign({}, song)
    delete songObj.ordernumber
    delete songObj.createdAt
    delete songObj.updatedAt
    return Api().put(`song/${songObj.id}`, songObj)
  },

  async putSongPresets (song) {
    const songObj = Object.assign({}, song)
    delete songObj.ordernumber
    delete songObj.createdAt
    delete songObj.updatedAt
    return Api().put(`songpresets/${songObj.id}`, songObj)
  }
}
