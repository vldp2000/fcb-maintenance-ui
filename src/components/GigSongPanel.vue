<template>
  <v-container fluid>
    <v-snackbar
      v-model="savingOrder"
      timeout="-1"
      color="info"
      top
    >
      {{ savingOrderMessage }}
    </v-snackbar>
    <v-row no-gutters>
      <v-col cols="12" md="6">
        <div class="songGridColumn">
          <div class="songGridHeader">
            <h3>Set the order of Songs</h3>
          </div>
          <div class="songGridScroller">
            <table class="table table-striped table-bordered">
              <thead class="thead-dark">
                <tr>
                  <th scope="col" class="orderColumn">Order</th>
                  <th scope="col" class="idColumn">Id</th>
                  <th scope="col">Name</th>
                  <th scope="col" class="actionColumn">Actions</th>
                </tr>
              </thead>
              <draggable
                v-model="gigSonglist"
                tag="tbody"
                group="songs"
                @change="syncSelectedSong"
              >
                <tr
                  v-for="(item, index) in gigSonglist"
                  :key="item.id"
                  :class="{ selectedSongRow: isSelectedSong(item) }"
                  @click="selectGigSong(item)"
                >
                  <td scope="row" class="orderColumn">{{ index + 1 }}</td>
                  <td scope="row" class="idColumn">{{ item.id }}</td>
                  <td>{{ item.name }}</td>
                  <td class="actionColumn">
                    <v-btn icon small title="Move up" @click.stop="moveSongUp(index)">
                      <v-icon small>mdi-arrow-up-bold</v-icon>
                    </v-btn>
                    <v-btn icon small title="Move down" @click.stop="moveSongDown(index)">
                      <v-icon small>mdi-arrow-down-bold</v-icon>
                    </v-btn>
                    <v-btn icon small title="Move under selected song" @click.stop="reallocateSong(item)">
                      <v-icon small>mdi-subdirectory-arrow-right</v-icon>
                    </v-btn>
                    <v-btn icon small title="Unallocate song" @click.stop="unallocateSong(item)">
                      <v-icon small>mdi-chevron-double-right</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </draggable>
            </table>
          </div>
          <div class="songGridActions">
            <v-btn
              color="primary"
              large
              class="saveOrderButton"
              :loading="savingOrder"
              :disabled="savingOrder"
              @click="saveOrder"
            >
              <v-icon left>save</v-icon>
              Save Gig
            </v-btn>
          </div>
        </div>
      </v-col>
       <v-col cols="12" md="6">
        <div class="songGridColumn">
          <div class="songGridHeader">
            <h3>All Songs</h3>
          </div>
          <div class="songGridScroller">
            <table class="table table-striped table-bordered">
              <thead class="thead-dark">
                <tr>
                  <th scope="col" class="allocateColumn"></th>
                  <th scope="col" class="idColumn">Id</th>
                  <th scope="col">Name</th>
                </tr>
              </thead>
              <draggable
                v-model="allSongList"
                tag="tbody"
                group="songs"
              >
                <tr v-for="item in allSongList" :key="item.id" @dblclick="allocateSong(item)">
                  <td class="allocateColumn">
                    <v-btn icon small title="Allocate song" @click.stop="allocateSong(item)">
                      <v-icon small>mdi-chevron-double-left</v-icon>
                    </v-btn>
                  </td>
                  <td scope="row" class="idColumn">{{ item.id }}</td>
                  <td>{{ item.name }}</td>
                </tr>
              </draggable>
            </table>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable'
import { mapState } from 'vuex'

export default {
  name: 'GigSongPanel',
  display: 'Table',
  order: 8,

  components: {
    draggable
  },
  props: {
    gig: {
      type: Object,
      default: null
    }
  },

  data () {
    return {
      dragging: false,
      savingOrder: false,
      savingOrderMessage: '',
      selectedGigSongId: null,
      gigSonglist: [],
      allSongList: []
    }
  },
  computed: {
    ...mapState(['songList'])
  },
  mounted () {
    this.init()
  },

  methods: {
    init: async function () {
      if (this.gig) {
        this.gigSonglist = []
        for (const item of (this.gig.songList || [])) {
          const song = Object.assign({}, item)
          this.gigSonglist.push(song)
        }
      }
      if (this.songList) {
        let list = []
        for (const song of this.songList) {
          const sn = Object.assign({}, song)
          list.push(sn)
        }

        for (const song of this.gigSonglist) {
          list = list.filter(item => item.id !== song.id)
        }
        this.allSongList = list
        // console.log(this.gigSonglist)
        // console.log(' -------------------')
        // console.log(this.songList)
        // console.log(' -------------------')
        // console.log(this.gig)
        // console.log(' -------------------')
      }
      this.syncSelectedSong()
    },

    saveOrder: async function () {
      // console.log('------ save -----------')
      // console.log(this.gigSonglist)
      // console.log(this.songList)
      // console.log(this.gig)
      // console.log('------ save -----------')
      if (this.savingOrder) {
        return
      }
      this.savingOrder = true
      this.savingOrderMessage = 'Saving gig songs...'
      try {
        const payload = { gig: this.gig, songList: this.gigSonglist }
        await this.$store.dispatch('saveGigSongs', payload)
      } finally {
        this.savingOrder = false
        this.savingOrderMessage = ''
      }
    },
    checkMove: function (e) {
      this.$log.debug(`Future index:  ${e.draggedContext.futureIndex}`)
    },

    selectGigSong: function (song) {
      this.selectedGigSongId = song.id
    },

    isSelectedSong: function (song) {
      return song && song.id === this.selectedGigSongId
    },

    getSelectedGigSongIndex: function () {
      return this.gigSonglist.findIndex(song => song.id === this.selectedGigSongId)
    },

    getInsertIndexAfterSelected: function () {
      const selectedIndex = this.getSelectedGigSongIndex()
      if (selectedIndex < 0) {
        return this.gigSonglist.length
      }
      return selectedIndex + 1
    },

    allocateSong: function (song) {
      const sourceIndex = this.allSongList.findIndex(item => item.id === song.id)
      if (sourceIndex < 0) {
        return
      }
      const insertIndex = this.getInsertIndexAfterSelected()
      const allocatedSong = Object.assign({}, this.allSongList[sourceIndex])
      this.allSongList.splice(sourceIndex, 1)
      this.gigSonglist.splice(insertIndex, 0, allocatedSong)
    },

    unallocateSong: function (song) {
      const sourceIndex = this.gigSonglist.findIndex(item => item.id === song.id)
      if (sourceIndex < 0) {
        return
      }
      const unallocatedSong = this.gigSonglist[sourceIndex]
      this.gigSonglist.splice(sourceIndex, 1)
      this.allSongList.push(unallocatedSong)
      this.allSongList.sort((left, right) => left.id - right.id)
      this.syncSelectedSong()
    },

    moveSongUp: function (index) {
      if (index <= 0) {
        return
      }
      const song = this.gigSonglist[index]
      this.gigSonglist.splice(index, 1)
      this.gigSonglist.splice(index - 1, 0, song)
    },

    moveSongDown: function (index) {
      if (index < 0 || index >= this.gigSonglist.length - 1) {
        return
      }
      const song = this.gigSonglist[index]
      this.gigSonglist.splice(index, 1)
      this.gigSonglist.splice(index + 1, 0, song)
    },

    reallocateSong: function (song) {
      const sourceIndex = this.gigSonglist.findIndex(item => item.id === song.id)
      const selectedIndex = this.getSelectedGigSongIndex()
      if (sourceIndex < 0 || selectedIndex < 0 || sourceIndex === selectedIndex) {
        return
      }

      const movedSong = this.gigSonglist[sourceIndex]
      this.gigSonglist.splice(sourceIndex, 1)
      const adjustedSelectedIndex = this.getSelectedGigSongIndex()
      this.gigSonglist.splice(adjustedSelectedIndex + 1, 0, movedSong)
    },

    syncSelectedSong: function () {
      if (this.getSelectedGigSongIndex() >= 0) {
        return
      }
      this.selectedGigSongId = this.gigSonglist.length ? this.gigSonglist[0].id : null
    }
  }
}
</script>

<style scoped>
  .handle {
    float: left;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .buttons {
    margin-top: 35px;
  }
  .songGridColumn {
    display: flex;
    flex-direction: column;
    height: 560px;
    padding: 0 14px;
  }
  .songGridHeader {
    min-height: 44px;
  }
  .songGridScroller {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #d7dce8;
    border-radius: 4px;
    background: #fff;
  }
  .songGridActions {
    position: sticky;
    bottom: 0;
    padding: 14px 0 4px;
    background: #fff;
  }
  .saveOrderButton {
    min-width: 210px;
    font-weight: 700;
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  tr.selectedSongRow,
  tr.selectedSongRow:nth-child(even) {
    background-color: #c5d5ff;
  }

table {
  border-collapse: collapse;
  width: 100%;
}

table, th, td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  height: 30px;
}
tr {
  height: 30px;
}
td {
  height: 50px;
  vertical-align: center;
}
.orderColumn {
  width: 62px;
  text-align: center;
}
.idColumn {
  width: 56px;
  text-align: center;
}
.allocateColumn {
  width: 48px;
  text-align: center;
}
.actionColumn {
  width: 176px;
  white-space: nowrap;
}
tr:not(.selectedSongRow):hover {
  background-color: #a0a5c4;
}
</style>
