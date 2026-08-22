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
                  <th scope="col">Order</th>
                  <th scope="col">Id</th>
                  <th scope="col">Name</th>
                </tr>
              </thead>
              <draggable
                v-model="gigSonglist"
                tag="tbody"
                group="songs"
              >
                <tr v-for="(item, index) in gigSonglist" :key="item.id">
                  <td scope="row">{{ index + 1 }}</td>
                  <td scope="row">{{ item.id }}</td>
                  <td>{{ item.name }}</td>
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
                  <th scope="col">Id</th>
                  <th scope="col">Name</th>
                </tr>
              </thead>
              <draggable
                v-model="allSongList"
                tag="tbody"
                group="songs"
              >
                <tr v-for="item in allSongList" :key="item.id">
                  <td scope="row">{{ item.id }}</td>
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
        for (let item of this.gig.songList) {
          const song = await Object.assign({}, item)
          await this.gigSonglist.push(song)
        }
      }
      if (this.songList) {
        let list = []
        for (let song of this.songList) {
          let sn = await Object.assign({}, song)
          await list.push(sn)
        }

        for (let song of this.gigSonglist) {
          list = await list.filter(item => item.id !== song.id)
        }
        this.allSongList = list
        // console.log(this.gigSonglist)
        // console.log(' -------------------')
        // console.log(this.songList)
        // console.log(' -------------------')
        // console.log(this.gig)
        // console.log(' -------------------')
      }
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
        const payload = { 'gig': this.gig, 'songList': this.gigSonglist }
        await this.$store.dispatch('saveGigSongs', payload)
      } finally {
        this.savingOrder = false
        this.savingOrderMessage = ''
      }
    },
    checkMove: function (e) {
      this.$log.debug(`Future index:  ${e.draggedContext.futureIndex}`)
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

table {
  border-collapse: collapse;
  width: 100%;
}

table, th, td {
  border-bottom: 1px solid #ddd;
  padding: 15px;
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
tr:hover {
  background-color: #a0a5c4;
}
</style>
