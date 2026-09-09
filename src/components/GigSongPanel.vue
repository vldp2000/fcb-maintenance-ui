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
            <v-chip v-if="isDirty" small color="warning" text-color="black">Unsaved changes</v-chip>
          </div>
          <div ref="assignedSongScroller" class="songGridScroller">
            <table class="table table-striped table-bordered">
              <thead class="thead-dark">
                <tr>
                  <th scope="col" class="dragColumn"></th>
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
                handle=".songDragHandle"
                :delay="180"
                :delay-on-touch-only="true"
                :touch-start-threshold="8"
                @start="captureGridState"
                @change="onSongListsChanged"
              >
                <tr
                  v-for="(item, index) in gigSonglist"
                  :key="item.id"
                  :class="{ selectedSongRow: isSelectedSong(item) }"
                  @click="selectGigSong(item)"
                >
                  <td class="dragColumn">
                    <button class="songDragHandle" type="button" title="Drag song" aria-label="Drag song">
                      <v-icon small>mdi-drag-vertical</v-icon>
                    </button>
                  </td>
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
            <v-btn text class="closeEditorButton" @click="$emit('request-close')">Close</v-btn>
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
          <div ref="allSongsScroller" class="songGridScroller">
            <table class="table table-striped table-bordered">
              <thead class="thead-dark">
                <tr>
                  <th scope="col" class="dragColumn"></th>
                  <th scope="col" class="allocateColumn"></th>
                  <th scope="col" class="idColumn">Id</th>
                  <th scope="col">Name</th>
                </tr>
              </thead>
              <draggable
                v-model="allSongList"
                tag="tbody"
                group="songs"
                handle=".songDragHandle"
                :delay="180"
                :delay-on-touch-only="true"
                :touch-start-threshold="8"
                @start="captureGridState"
                @change="onSongListsChanged"
              >
                <tr v-for="item in allSongList" :key="item.id" @dblclick="allocateSong(item)">
                  <td class="dragColumn">
                    <button class="songDragHandle" type="button" title="Drag song" aria-label="Drag song">
                      <v-icon small>mdi-drag-vertical</v-icon>
                    </button>
                  </td>
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
      selectedSongIndexBeforeChange: 0,
      isDirty: false,
      gridScrollPositions: {
        assigned: 0,
        allSongs: 0
      },
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
      this.markClean()
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
        this.markClean()
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
      this.captureGridState()
      const sourceIndex = this.allSongList.findIndex(item => item.id === song.id)
      if (sourceIndex < 0) {
        return
      }
      const insertIndex = this.getInsertIndexAfterSelected()
      const allocatedSong = Object.assign({}, this.allSongList[sourceIndex])
      this.allSongList.splice(sourceIndex, 1)
      this.gigSonglist.splice(insertIndex, 0, allocatedSong)
      this.markDirty()
      this.restoreGridScrollPositions()
    },

    unallocateSong: function (song) {
      this.captureGridState()
      const sourceIndex = this.gigSonglist.findIndex(item => item.id === song.id)
      if (sourceIndex < 0) {
        return
      }
      const unallocatedSong = this.gigSonglist[sourceIndex]
      this.gigSonglist.splice(sourceIndex, 1)
      this.allSongList.push(unallocatedSong)
      this.allSongList.sort((left, right) => left.id - right.id)
      if (song.id === this.selectedGigSongId) {
        const nextSelection = this.gigSonglist[Math.min(sourceIndex, this.gigSonglist.length - 1)]
        this.selectedGigSongId = nextSelection ? nextSelection.id : null
      } else {
        this.syncSelectedSong()
      }
      this.markDirty()
      this.restoreGridScrollPositions()
    },

    moveSongUp: function (index) {
      if (index <= 0) {
        return
      }
      this.captureGridState()
      const song = this.gigSonglist[index]
      this.gigSonglist.splice(index, 1)
      this.gigSonglist.splice(index - 1, 0, song)
      this.markDirty()
      this.restoreGridScrollPositions()
    },

    moveSongDown: function (index) {
      if (index < 0 || index >= this.gigSonglist.length - 1) {
        return
      }
      this.captureGridState()
      const song = this.gigSonglist[index]
      this.gigSonglist.splice(index, 1)
      this.gigSonglist.splice(index + 1, 0, song)
      this.markDirty()
      this.restoreGridScrollPositions()
    },

    reallocateSong: function (song) {
      const sourceIndex = this.gigSonglist.findIndex(item => item.id === song.id)
      const selectedIndex = this.getSelectedGigSongIndex()
      if (sourceIndex < 0 || selectedIndex < 0 || sourceIndex === selectedIndex) {
        return
      }

      this.captureGridState()
      const movedSong = this.gigSonglist[sourceIndex]
      this.gigSonglist.splice(sourceIndex, 1)
      const adjustedSelectedIndex = this.getSelectedGigSongIndex()
      this.gigSonglist.splice(adjustedSelectedIndex + 1, 0, movedSong)
      this.markDirty()
      this.restoreGridScrollPositions()
    },

    markDirty: function () {
      if (this.isDirty) return
      this.isDirty = true
      this.$emit('dirty-change', true)
    },

    markClean: function () {
      this.isDirty = false
      this.$emit('dirty-change', false)
    },

    captureGridState: function () {
      this.selectedSongIndexBeforeChange = Math.max(this.getSelectedGigSongIndex(), 0)
      const refs = this.$refs || {}
      this.gridScrollPositions = {
        assigned: refs.assignedSongScroller ? refs.assignedSongScroller.scrollTop : 0,
        allSongs: refs.allSongsScroller ? refs.allSongsScroller.scrollTop : 0
      }
    },

    restoreGridScrollPositions: function () {
      const restore = () => {
        const refs = this.$refs || {}
        if (refs.assignedSongScroller) refs.assignedSongScroller.scrollTop = this.gridScrollPositions.assigned
        if (refs.allSongsScroller) refs.allSongsScroller.scrollTop = this.gridScrollPositions.allSongs
      }
      this.$nextTick(restore)
    },

    onSongListsChanged: function () {
      if (this.getSelectedGigSongIndex() < 0) {
        const nextSelection = this.gigSonglist[Math.min(this.selectedSongIndexBeforeChange, this.gigSonglist.length - 1)]
        this.selectedGigSongId = nextSelection ? nextSelection.id : null
      }
      this.markDirty()
      this.restoreGridScrollPositions()
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
    height: 65vh;
    height: clamp(360px, calc(100dvh - 260px), 680px);
    padding: 0 14px;
  }
  .songGridHeader {
    min-height: 44px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .songGridScroller {
    flex: 1;
    min-height: 0;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior-y: contain;
    scrollbar-gutter: stable;
    border: 1px solid #d7dce8;
    border-radius: 4px;
    background: #fff;
  }
  .songGridScroller::-webkit-scrollbar {
    width: 12px;
  }
  .songGridScroller::-webkit-scrollbar-track {
    background: #eef1f7;
  }
  .songGridScroller::-webkit-scrollbar-thumb {
    background: #7e8aa8;
    border: 2px solid #eef1f7;
    border-radius: 8px;
  }
  .songGridScroller thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #343a40;
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
.dragColumn {
  width: 46px;
  min-width: 46px;
  padding-left: 3px;
  padding-right: 3px;
  text-align: center;
}
.songDragHandle {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: grab;
  touch-action: none;
}
.songDragHandle:active {
  cursor: grabbing;
  background: #dce4f7;
}
.actionColumn {
  width: 176px;
  white-space: nowrap;
}
tr:not(.selectedSongRow):hover {
  background-color: #a0a5c4;
}
</style>
