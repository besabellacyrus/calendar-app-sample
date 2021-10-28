<template>
  <div id="app">
    <div class="calendar-container">
      <div>
        <v-calendar :attributes="attributes"></v-calendar>
        <div class="list-container">
          <div v-for="(event, idx) in eventLists"
          :key="event.key"
          class="list-item"
          @mouseover="hoverLstIdx = event.key"
          @mouseleave="hoverLstIdx = null"
          :style="{backgroundColor: randomColor(event.key)}"
          >
            <div style="display: flex; justify-content: space-between;">
              <span>{{ event.customData.title | capitalize }}</span>
              <span class="x-button-list" v-show="hoverLstIdx === event.key" @click="deleteEventList(idx)">
                <small>Remove</small>
              </span>
            </div>
            <p>{{ event.customData.startDisplay + ' | ' + event.customData.endDisplay}} </p>
          </div>
        </div>
      </div>
      <v-calendar
        class="custom-calendar max-w-full"
        :masks="masks"
        :attributes="attributes"
        disable-page-swipe
        is-expanded
      >
        <template v-slot:day-content="{ day }">
          <div class="flex flex-col h-full z-10 overflow-hidden">
            <div class="clickable-container"  @dblclick="dbClickAddEvent(day)">
              <span class="day-label text-sm text-gray-900">{{ day.day }}</span>
              <div class="flex-grow overflow-y-auto overflow-x-auto">
                <p
                  v-for="(attr, idx) in attributes"
                  :key="attr.key"
                  class="event-text text-xs leading-tight rounded-sm p-1 mt-0 mb-1"
                  :class="attr.customData.class"
                  @mouseover="hoverIdx = attr.key"
                  @mouseleave="hoverIdx = null"
                >
                  <span v-if="(attr.customData.label === day.label && attr.customData.month === day.month)">
                  {{ attr.customData.title | capitalize }}
                  <span class="x-button" v-show="hoverIdx === attr.key" @click="deleteEvent(idx)">
                    <small>Remove</small>
                  </span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </template>
      </v-calendar>
    </div>
    <div v-if="isOpenAddEvent" class="popup-add-event">
      <div class="popup-add-event-container">
        <h2>{{ addEventTitle }}</h2>
        <div>
          <input type="text" class="input" v-model="eventTitle" placeholder="Event Title">
        </div>
        <div>
          <vue-timepicker v-model="startTimeVal" format="hh:mm A" @change="changeStartTime"></vue-timepicker>
          <vue-timepicker v-model="endTimeVal" format="hh:mm A"></vue-timepicker>
        </div>
        <div class="popup-actions">
          <button v-show="eventTitle !== ''" @click="addEvent({ title: eventTitle })">Add Event</button>
          <button @click="isOpenAddEvent = false">Cancel</button>
        </div>
        <div class="conflict-message" v-show="hasConflicts">
          <p>Conflict on schedule. Please change time.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueTimepicker from 'vue2-timepicker/src/vue-timepicker.vue'
import Moment from 'moment';
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);

export default {
  name: 'App',
  components: {
    VueTimepicker
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  },
  data() {
    return {
      hasConflicts: false,
      hoverIdx: null,
      hoverLstIdx: null,
      events: [
        {
          key: 'today',
          dot: true,
          customData: {
            title: '',
            class: ''
          },
          dates: new Date(),
        }
      ],
      isOpenAddEvent: false,
      addEventTitle: "",
      eventDay: null,
      eventTitle: "",
      startTimeVal: {
        hh: '01',
        mm: '00',
        A: 'AM'
      },
      endTimeVal: {
        hh: '02',
        mm: '00',
        A: 'AM'
      },
      timezone: '',
      masks: {
        weekdays: 'WWW',
      },
      colorCache: {}
    };
  },
  watch: {
    events: {
      deep: true,
      handler(val) {
        this.attributes = val
      }
    }
  },
  computed: {
    eventLists() {
      return this.events.filter(attr => {
        return attr.key !== 'today'
      })
    },
    attributes: {
      get() {
        return this.events
      },
      set() {
        return this.events
      }
    }
  },
  methods:  {
    conflictChecker(data) {
      let intersects = []
      for (let i = 0; i < this.eventLists.length; i++) {
        console.log({ cyrus: this.eventLists[i].customData, data })
        const date1 = [this.eventLists[i].customData.start, this.eventLists[i].customData.end]
        const date2 = [data.start, data.end]

        const range1 = moment.range(date1)
        const range2 = moment.range(date2)

        if(range1.overlaps(range2)) {
            if((range2.contains(range1, true) || range1.contains(range2, true)) && !date1[0].isSame(date2[0])) {
              intersects.push(true)
            }
            else {
              intersects.push(true)
            }
        } else {
          intersects.push(false)
        }
      }
      return intersects;
    },
    randomColor(id) {
      const r = () => Math.floor(256 * Math.random());

      return this.colorCache[id] || (this.colorCache[id] = `rgb(${r()}, ${r()}, ${r()})`);
    },
    timeFormatter(time) {
      return `${time.hh}:${time.mm} ${time['A']}`
    },
    dbClickAddEvent(day) {
      this.addEventTitle = day.ariaLabel
      this.isOpenAddEvent = true;
      this.eventTitle = "";
      this.eventDay = day;
    },
    changeStartTime() {
      this.endTimeVal = this.startTimeVal
    },
    addEvent(event) {

      const startTf =  moment(`${this.startTimeVal.hh}:${this.startTimeVal.mm} ${this.startTimeVal['A']}`, ["h:mm A"]).format("HH:mm");
      const endTf =  moment(`${this.endTimeVal.hh}:${this.endTimeVal.mm} ${this.endTimeVal['A']}`, ["h:mm A"]).format("HH:mm");

      const start = moment(`${this.eventDay.id} ${startTf}`)
      const end = moment(`${this.eventDay.id} ${endTf}`)
      const check = this.conflictChecker({ start, end })

      if (check.includes(true)) {
        console.log('it has true')
        this.hasConflicts = true
      } else {
        this.hasConflicts = false

        if (this.eventDay) {
          const year = this.eventDay.year;
          const month = this.eventDay.month;

          const value = {
              key: this.events.length + 1,
              dot: true,
              customData: {
                label: this.eventDay.label,
                month: this.eventDay.month,
                start: start,
                end: end,
                startDisplay: `${this.startTimeVal.hh}:${this.startTimeVal.mm} ${this.startTimeVal['A']}`,
                endDisplay:`${this.endTimeVal.hh}:${this.endTimeVal.mm} ${this.endTimeVal['A']}`,
                title: event.title,
                class: 'bg-blue-500 text-white',
              },
              dates: new Date(year, month, this.eventDay.day),
            }

          this.events.push(value)
          this.isOpenAddEvent = false;
        }
      }
    },
    deleteEvent(idx) {
      if (idx > -1) {
        this.events.splice(idx, 1);
      }
    },
    deleteEventList(idx) {
      if (idx > -1) {
        this.events.splice(idx + 1, 1);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::-webkit-scrollbar {
  width: 0px;
}
::-webkit-scrollbar-track {
  display: none;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 60px;
  margin: 0 auto;
  max-width: 1366px;
}

.x-button, .x-button-list{
  color: red;
  cursor: pointer;
  outline: whitesmoke;
   -webkit-animation: fadeInFromNone 0.5s ease-out;
  -moz-animation: fadeInFromNone 0.5s ease-out;
  -o-animation: fadeInFromNone 0.5s ease-out;
  animation: fadeInFromNone 0.5s ease-out;
}
.conflict-message {
  color: red;
}
.x-button-list {
  color: #fff;
}

.list-container {
  text-align: left;
  padding: 1em;
  .list-item {
    border-radius: 5px;
    color: #fff;
    padding: 1em;
    margin-bottom: 1em;
    -webkit-animation: fadeInFromNone 0.5s ease-out;
    -moz-animation: fadeInFromNone 0.5s ease-out;
    -o-animation: fadeInFromNone 0.5s ease-out;
    animation: fadeInFromNone 0.5s ease-out;
  }
}
.event-text {
  -webkit-animation: fadeInFromNone 0.5s ease-out;
  -moz-animation: fadeInFromNone 0.5s ease-out;
  -o-animation: fadeInFromNone 0.5s ease-out;
  animation: fadeInFromNone 0.5s ease-out;
}
.calendar-container {
  display: grid;
  justify-content: center;
  grid-template-columns: 0.3fr 1fr;
}

.popup-add-event {
  position: absolute;
  width: 100%;
  top: 20%;
  z-index: 9;
  display: flex;
  justify-content: center;
  .popup-add-event-container {
    background-color: #fff;
    border-radius: 24px;
    box-shadow: 1px 5px 50px #e3e3e3;
    width: 30%;
  }
  .input {
    font-size: 16px;
    font-family: inherit;
    padding: 0.25em 0.5em;
    background-color: #fff;
    // border-radius: 4px;
    margin-bottom: 1rem;
    width: 83%;
  }
  .popup-actions {
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    button {
      margin-right: 1rem;
    }
  }
}

.clickable-container {
  position: absolute;
  height: 100%;
  width: 100%;
}
/deep/ .custom-calendar.vc-container {
  --day-border: 1px solid #b8c2cc;
  --day-border-highlight: 1px solid #b8c2cc;
  --day-width: 90px;
  --day-height: 90px;
  --weekday-bg: #f8fafc;
  --weekday-border: 1px solid #eaeaea;
  border-radius: 0;
  width: 100%;
  & .vc-header {
    background-color: #f1f5f8;
    padding: 10px 0;
  }
  & .vc-weeks {
    padding: 0;
  }
  & .vc-weekday {
    background-color: var(--weekday-bg);
    border-bottom: var(--weekday-border);
    border-top: var(--weekday-border);
    padding: 5px 0;
  }
  & .vc-day {
    padding: 0 5px 3px 5px;
    text-align: left;
    height: var(--day-height);
    min-width: var(--day-width);
    background-color: white;
    color: #000 !important;
    &.weekday-1,
    &.weekday-7 {
      background-color: #eff8ff;
    }
    &:not(.on-bottom) {
      border-bottom: var(--day-border);
      &.weekday-1 {
        border-bottom: var(--day-border-highlight);
      }
    }
    &:not(.on-right) {
      border-right: var(--day-border);
    }
  }
  & .vc-day-dots {
    margin-bottom: 5px;
  }
}

@-webkit-keyframes fadeInFromNone {
    0% {
        display: none;
        opacity: 0;
    }

    1% {
        display: block;
        opacity: 0;
    }

    100% {
        display: block;
        opacity: 1;
    }
}

@-moz-keyframes fadeInFromNone {
    0% {
        display: none;
        opacity: 0;
    }

    1% {
        display: block;
        opacity: 0;
    }

    100% {
        display: block;
        opacity: 1;
    }
}

@-o-keyframes fadeInFromNone {
    0% {
        display: none;
        opacity: 0;
    }

    1% {
        display: block;
        opacity: 0;
    }

    100% {
        display: block;
        opacity: 1;
    }
}

@keyframes fadeInFromNone {
    0% {
        display: none;
        opacity: 0;
    }

    1% {
        display: block;
        opacity: 0;
    }

    100% {
        display: block;
        opacity: 1;
    }
}
</style>

