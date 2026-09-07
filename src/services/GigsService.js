import Api from '@/services/Api'

export default {
  async getAllData () {
    const result = await Api().get('all/gig')
    return result.data
  },

  async getGig (id) {
    const result = await Api().get(`gig/${id}`)
    return result.data
  },

  async getId () {
    const result = await Api().get('id/gig')
    return result.data.id
  },

  async putGig (gig) {
    const gigObj = Object.assign({}, gig)
    delete gigObj.songList
    return Api().put(`gig/${gig.id}`, gigObj)
  },

  async saveScheduledGigId (id) {
    const gigIdObj = { id }
    return Api().put('currentgig', gigIdObj)
  },
  async getScheduledGigId (id) {
    const result = await Api().get('currentgig')
    return result.data.id
  }
}
