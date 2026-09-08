import Api from '@/services/Api'

export default {
  async getAllData () {
    const result = await Api().get('all/preset')
    return result.data
  },
  async getId () {
    const result = await Api().get('id/preset')
    return result.data.id
  },
  async put (preset) {
    await Api().put(`preset/${preset.id}`, preset)
  },
  async delete (presetId) {
    await Api().delete(`preset/${presetId}`)
  }
}
