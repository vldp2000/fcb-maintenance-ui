<template>
  <v-layout>
    <v-flex class="ml-2">
       <v-container grid-list-md text-md-center fluid class="darkBackgroud">
          <v-row md12 no-gutters>
            <v-col cols="12" md="6">
              <div class="selector-panel">
              <v-select
                v-if="instrumentList"
                label="Select Instrument"
                v-model="selectedInstrumentId "
                :items="instrumentList"
                required
                item-text="name"
                item-value="id">
              </v-select>
              </div>
            </v-col>
          </v-row>
          <v-row v-if="errorMessage">
            <v-col cols="12">
              <v-alert type="warning" dense text dismissible @input="errorMessage = ''">{{ errorMessage }}</v-alert>
            </v-col>
          </v-row>

          <v-row>
            <v-col>
            <div>
            <v-data-table
              v-if ="presetList.length > 0"
              :headers="headers"
              :items="getInstrumentPresets()"
              sort-by="midipc"
              class="elevation-1"
              hide-default-footer
              item-key="id"
              disable-pagination
            >

              <template v-slot:item.instrument="{ item }">
                <v-chip color="blue" dark>{{ getInstrument(item.refinstrument) }}</v-chip>
              </template>

              <template v-slot:item.bank="{ item }">
                <v-chip color="blue" dark>{{ getInstrumentBank(item.refinstrumentbank) }}</v-chip>
              </template>

              <template v-slot:item.pc="{ item }">
                <div class="customKnob">
                  <my-knob
                    :value="parseInt(item.midipc,10)"
                  >
                  </my-knob>
                </div>
              </template>

              <template v-slot:top>
                <v-toolbar flat color="white">
                  <v-toolbar-title>Presets</v-toolbar-title>
                  <v-divider
                    class="mx-4"
                    inset
                    vertical
                  ></v-divider>
                  <v-spacer></v-spacer>
                  <v-dialog v-model="dialog" max-width="500px">
                    <template v-slot:activator="{ on }">
                      <v-btn color="primary" dark class="mb-2" v-on="on">New Item</v-btn>
                    </template>
                    <v-card>
                      <v-card-title>
                        <span class="headline">{{ formTitle }}</span>
                      </v-card-title>

                      <v-card-text>
                        <v-container>
                          <v-row v-if="errorMessage">
                            <v-col cols="12">
                              <v-alert type="error" dense text>{{ errorMessage }}</v-alert>
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col cols="12" sm="6" md="4">
                              <v-text-field v-model="editedItem.name" label="Name"></v-text-field>
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                              <v-text-field v-model="editedItem.midipc" label="Midi PC"></v-text-field>
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col cols="12" sm="6" md="4">
                              <v-select
                                v-if="instrumentList"
                                label="Select Instrument"
                                v-model="instrumentId"
                                :items="instrumentList"
                                required
                                item-text="name"
                                item-value="id">
                              </v-select>
                            </v-col>
                            <v-col cols="12" sm="6" md="4">
                              <v-select
                                v-if="bankList"
                                label="Select Bank"
                                v-model="bankId"
                                :items="bankList"
                                required
                                item-text="name"
                                item-value="id">
                              </v-select>
                            </v-col>
                          </v-row>

                        </v-container>
                      </v-card-text>

                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="cyan darken-1" text :disabled="savingPreset" @click="closeDialog">Cancel</v-btn>
                        <v-btn color="cyan darken-1" text :loading="savingPreset" @click="savePreset">Save</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-toolbar>
              </template>
              <template v-slot:item.action="{ item }">
                <div class="editicon">
                  <v-icon
                    big
                    class="mr-2"
                    @click="editItem(item)"
                  >
                    mdi-pencil
                  </v-icon>
                  <v-icon
                    big
                    class="mr-2"
                    @click="deleteItem(item)"
                  >
                    mdi-delete
                  </v-icon>
                </div>
              </template>
            </v-data-table>
            </div>
            </v-col>
          </v-row>

       </v-container>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapState } from 'vuex'
import PresetUsageService from '@/services/PresetUsageService'

export default {
  data () {
    return {
      presets: [],
      dialog: false,
      selectedInstrumentId: -1,
      headers: [
        {
          text: 'Name',
          align: 'left',
          // sortable: false,
          value: 'name'
        },
        { text: 'Instrument', value: 'instrument' },
        { text: 'Bank', value: 'bank' },
        { text: 'Midi PC', value: 'midipc' },
        { text: 'PC', value: 'pc' },
        { text: 'Actions', value: 'action', sortable: false }
      ],

      editedIndex: -1,
      editedItem: {
        id: -1,
        name: '',
        midipc: 0,
        refinstrument: null,
        refinstrumentbank: null,
        isDefault: 0
      },
      defaultItem: {
        id: -1,
        name: '',
        midipc: 0,
        refinstrument: null,
        refinstrumentbank: null,
        isDefault: 0
      },
      selected: [],
      instrumentId: -1,
      bankList: [],
      bankId: -1,
      savingPreset: false,
      deletingPreset: false,
      errorMessage: ''
    }
  },

  // mounted () {
  //   this.init()
  // },

  computed: {
    ...mapState(['presetList', 'instrumentList', 'instrumentBankList']),
    formTitle () {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    }
    // instrumentId: {
    //   get () { return this.selectedInstrumentId },
    //   set (value) { this.selectedInstrumentId, value) }
    // }
  },

  watch: {
    presetList: function (newValue, oldValue) {
      this.presets = newValue
    },
    dialog: function (val) {
      val || this.closeDialog()
    },
    instrumentId: function () {
      // this.$log.debug(`-- on InstrumentId change ${this.instrumentId}`)
      if (this.instrumentId && this.instrumentId > 0) {
        this.editedItem.refinstrument = this.instrumentId
        this.bankList = this.getBankList(this.instrumentId)
      } else {
        this.bankList = []
      }

      if (this.dialog && this.editedIndex > -1 && this.bankList.length > 0) {
        this.bankId = this.editedItem.refinstrumentbank
      }
    },
    bankId: function () {
      this.editedItem.refinstrumentbank = this.bankId
    }
  },

  methods: {
    editItem (item) {
      // this.$log.debug(`-------start editItem (item)  ${item.id}`)
      this.editedIndex = this.presetList.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialog = true
      this.errorMessage = ''
      this.instrumentId = item.refinstrument
      // this.$log.debug(`-------finish editItem (item)  ${item.id}`)
    },

    async deleteItem (item) {
      this.errorMessage = ''
      if (!item || item.id < 0 || this.deletingPreset) return
      if (!confirm('Are you sure you want to delete this preset?')) return

      this.deletingPreset = true
      try {
        const usage = await PresetUsageService.getUsage(item.refinstrument, item.midipc)
        if (usage && usage.usageCount > 0) {
          this.errorMessage = `Preset is used in ${usage.usageCount} song program${usage.usageCount === 1 ? '' : 's'} and cannot be deleted.`
          return
        }
        await this.$store.dispatch('deletePreset', item.id)
      } catch (err) {
        this.errorMessage = `Could not delete preset: ${err.message || err}`
        this.$log.debug(err)
      } finally {
        this.deletingPreset = false
      }
    },

    closeDialog () {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
        this.instrumentId = -1
        this.bankList = []
        this.bankId = -1
        this.errorMessage = ''
      }, 300)
    },

    validatePreset () {
      const midiPc = Number(this.editedItem.midipc)
      if (!this.editedItem.name || !this.editedItem.name.trim()) {
        return 'Preset name is required.'
      }
      if (!Number.isInteger(midiPc) || midiPc < 0 || midiPc > 127) {
        return 'Midi PC must be a number between 0 and 127.'
      }
      if (!this.editedItem.refinstrument || this.editedItem.refinstrument < 1) {
        return 'Instrument is required.'
      }
      if (!this.editedItem.refinstrumentbank || this.editedItem.refinstrumentbank < 1) {
        return 'Bank is required.'
      }
      const duplicate = this.presetList.find(item => item.id !== this.editedItem.id &&
        parseInt(item.refinstrument, 10) === parseInt(this.editedItem.refinstrument, 10) &&
        parseInt(item.midipc, 10) === midiPc)
      if (duplicate) {
        return `Instrument and Midi PC are already used by "${duplicate.name}".`
      }
      this.editedItem.midipc = midiPc
      return ''
    },

    async savePreset () {
      // this.$log.debug('savePreset () -------')
      // this.$log.debug(this.editedItem)
      this.errorMessage = this.validatePreset()
      if (this.errorMessage) return

      this.savingPreset = true
      try {
        if (this.editedIndex > -1) {
          await this.$store.dispatch('updatePreset', this.editedItem)
        } else {
          await this.$store.dispatch('addPreset', this.editedItem)
        }
        this.closeDialog()
      } catch (err) {
        this.errorMessage = `Could not save preset: ${err.message || err}`
        this.$log.debug(err)
      } finally {
        this.savingPreset = false
      }
    },
    getBankList (id) {
      // this.$log.debug(' -----getBankList======== ')
      let result = []
      // this.$log.debug(id)
      if (id > -1 && this.editedItem.refinstrument && this.editedItem.refinstrument > -1) {
        result = this.instrumentBankList.filter(item => item.refinstrument === id)
        if (result && result.length === 1) {
          this.bankId = result[0].id
        }
      }
      // this.$log.debug(result)
      return result
    },
    getInstrument (id) {
      let instrument = null
      if (id > 0 && this.instrumentList.length > 0) {
        instrument = this.instrumentList.find(i => i.id === id)
      }
      if (instrument) {
        return instrument.name
      } else {
        return ''
      }
    },
    getInstrumentBank (id) {
      let bank = null
      if (id > 0 && this.instrumentBankList.length > 0) {
        bank = this.instrumentBankList.find(i => i.id === id)
      }
      if (bank) {
        return bank.name
      } else {
        return ''
      }
    },

    getInstrumentPresets () {
      if (!this.selectedInstrumentId || this.selectedInstrumentId === -1) {
        return this.presetList
      } else {
        const result = this.presetList.filter(item => item.refinstrument === this.selectedInstrumentId)
        if (result && result.length > 0) {
          return result
        } else {
          return []
        }
      }
    }
  }
}
</script>

<style scoped>

  .customKnob {
    height:80px;
    width: 100px;
    padding-top: 5px;
  }
  .dataTable {
    font-size: 28px !important;
  }
</style>
