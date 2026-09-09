<template>
  <custom-panel title="Gigs">
    <v-data-table
      :headers="headers"
      :items="gigList"
      sort-by="gigdate"
      class="elevation-1"
      :single-expand="singleExpand"
      :expanded.sync="expanded"
      hide-default-footer
      item-key="id"
      @click:row="rowClicked"
      disable-pagination
    >
      <template v-slot:expanded-item="{ headers }">
        <td :colspan="headers.length">
          <div>
            <gig-song-panel
              :gig="selectedGig"
              @dirty-change="songEditorDirty = $event"
              @request-close="closeSongs"
            />
          </div>
        </td>
      </template>

      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>Gigs</v-toolbar-title>
          <v-divider
            class="mx-4"
            inset
            vertical/>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on }">
              <v-btn color="primary" dark class="mb-2" v-on="on" @click="newItem">New Gig</v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-alert
                  v-if="savingGigMessage"
                  dense
                  text
                  type="info"
                >
                  {{ savingGigMessage }}
                </v-alert>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <v-text-field v-model="editedItem.name" label="Name"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" sm="6" md="4">
                      <v-date-picker v-model="editedItem.gigdate" :landscape="landscape" :reactive="reactive"></v-date-picker>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="cyan darken-1" text @click="closeDialog">Cancel</v-btn>
                <v-btn color="cyan darken-1" text @click="saveGig">Save</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.songs="{ item }">
        <div class="customTableCell">{{ getGigSongCount(item) }}</div>
      </template>
      <template v-slot:item.songActions="{ item }">
        <v-btn
          outlined
          small
          color="primary"
          class="rowActionButton mr-1"
          @click.stop="openSongs(item)"
        >
          <v-icon small left>queue_music</v-icon>
          Songs
        </v-btn>
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn
          outlined
          small
          color="primary"
          class="rowActionButton mr-1"
          @click.stop="editItem(item)"
        >
          <v-icon small left>edit</v-icon>
          Edit
        </v-btn>
      </template>
      <template v-slot:item.save="{ item }">
        <v-btn
          outlined
          small
          color="primary"
          class="rowActionButton mr-1"
          @click.stop="saveGigRow(item)"
        >
          <v-icon small left>save</v-icon>
          Save
        </v-btn>
      </template>
    </v-data-table>
  </custom-panel>
</template>

<script>

import { mapState } from 'vuex'
import GigSongPanel from '@/components/GigSongPanel'

export default {
  name: 'GigPanel',
  components: {
    GigSongPanel
  },
  data () {
    return {
      dialog: false,
      expanded: [],
      singleExpand: true,
      savingGig: false,
      savingGigMessage: '',
      songEditorDirty: false,
      headers: [
        {
          text: 'Name',
          align: 'left',
          sortable: false,
          value: 'name'
        },
        { text: 'Date', value: 'gigdate' },
        { text: 'Songs', value: 'songs', sortable: false },
        { text: 'Song List', value: 'songActions', sortable: false },
        { text: 'Action', value: 'action', sortable: false },
        { text: 'Save', value: 'save', sortable: false }
      ],

      editedIndex: -1,
      editedItem: {
        id: -1,
        name: '',
        gigdate: '',
        songList: []
      },
      defaultItem: {
        id: -1,
        name: '',
        gigdate: '',
        songList: []
      },
      selected: [],
      landscape: true,
      reactive: true,
      selectedGig: []
    }
  },
  computed: {
    ...mapState(['gigList', 'allInitialized']),
    formTitle () {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    }
  },

  watch: {
    dialog: function (val) {
      val || this.closeDialog()
    }
  },

  beforeRouteLeave (to, from, next) {
    if (this.confirmDiscardSongChanges()) {
      next()
    } else {
      next(false)
    }
  },

  methods: {
    newItem () {
      this.editedIndex = -1
      this.editedItem = Object.assign({}, this.defaultItem)
      this.dialog = true
    },

    editItem (item) {
      // this.$log.debug(item)
      this.editedIndex = this.gigList.indexOf(item)
      // this.$log.debug(this.editedIndex)
      this.editedItem = Object.assign({}, item)
      // this.$log.debug(this.editedItem)
      this.dialog = true
    },

    closeDialog () {
      this.dialog = false
      setTimeout(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      }, 300)
    },

    async saveGig () {
      if (this.savingGig) {
        return
      }
      this.savingGig = true
      this.savingGigMessage = 'Saving gig...'
      // this.$log.debug('saveGig () -------')
      // this.$log.debug(this.editedItem)
      const savedGig = this.editedItem
      try {
        if (this.editedIndex > -1) {
          // GigsService.put(this.editedItem)
          await this.$store.dispatch('saveGigSongs', {
            gig: savedGig,
            songList: savedGig.songList || savedGig.shortSongList || []
          })
        } else {
          await this.$store.dispatch('addGig', savedGig)
        }
      } catch (err) {
        this.$log.debug(err)
      }
      if (!savedGig.songList) {
        savedGig.songList = []
      }
      this.selectedGig = savedGig
      this.expanded = [savedGig]
      this.savingGig = false
      this.savingGigMessage = ''
      this.closeDialog()
    },

    async saveGigRow (gig) {
      if (this.savingGig) {
        return
      }
      this.savingGig = true
      this.savingGigMessage = 'Saving gig...'
      try {
        await this.$store.dispatch('saveGigSongs', {
          gig,
          songList: gig.songList || gig.shortSongList || []
        })
      } catch (err) {
        this.$log.debug(err)
      } finally {
        this.savingGig = false
        this.savingGigMessage = ''
      }
    },

    getGigSongCount (gig) {
      if (gig && gig.songList) {
        return gig.songList.length
      }
      if (gig && gig.shortSongList) {
        return gig.shortSongList.length
      }
      return 0
    },

    openSongs (gig) {
      if (this.expanded.length && this.expanded[0].id === gig.id) {
        return
      }
      if (this.expanded.length && this.expanded[0].id !== gig.id && !this.confirmDiscardSongChanges()) {
        return
      }
      if (!gig.songList) {
        gig.songList = []
      }
      this.selectedGig = gig
      this.expanded = [gig]
      this.songEditorDirty = false
    },

    confirmDiscardSongChanges () {
      return !this.songEditorDirty || confirm('Discard unsaved changes to this gig song list?')
    },

    closeSongs () {
      if (!this.confirmDiscardSongChanges()) return false
      this.expanded = []
      this.selectedGig = []
      this.songEditorDirty = false
      return true
    },

    async rowClicked (value) {
      // console.log(value)
      let oldGigId = -1
      if (this.expanded.length === 1) {
        oldGigId = this.expanded[0].id
      }
      // this.$log.debug(value)
      if (oldGigId === value.id) {
        this.closeSongs()
        return
      }
      if (oldGigId !== -1 && !this.confirmDiscardSongChanges()) return
      if (!value.songList) {
        value.songList = []
      }
      // this.$log.debug('expand ----')
      this.selectedGig = value
      this.expanded = [value]
      this.songEditorDirty = false
    }
  }
}
</script>

<style scoped>
  .inner-text {
    /* allow the text to take all the available space in the svg on top of the gauge */
    height: 100%;
    width: 100%;
    text-align: center;
    margin-top: 50px;
    font-size: 50px !important;
  }
  .v-data-table th {
    font-size: 16px;
  }
  .v-data-table td {
    font-size: 20px;
  }
  .customTableCell {
    font-size: 20px !important;
  }
  .rowActionButton {
    min-width: 94px;
    border-width: 1px;
    font-weight: 600;
  }

</style>
