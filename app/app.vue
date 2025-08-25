<template>
  <div class="container pt-2">
    <h1>Upcoming PPP Events</h1>
    <br>
    <div>
      <button
        @click='getEvents'
        class="btn btn-primary"
      >
        Update Events
      </button>
      <button
        @click='downloadSheet'
        class="btn btn-success mx-2"
      >
        Download Sheet
      </button>
      <button
        @click='resetAll'
        class="btn btn-danger"
      >
        Reset
      </button>
    </div>
    <br>
    <div>
      <form class="mb-4">
        <div class="form-group">
          <label for="include-online">Include online events?</label>
          <input type="checkbox" id="include-online" v-model="includeOnline" class="form-check-input mx-2">
        </div>
      </form>
      <h2>Total: {{ filteredEvents.length }}{{ filteredEvents.length !== allEvents.length ? ` / ${allEvents.length}` : ''}}</h2>
      <table class="table">
        <thead>
          <tr>
            <td>Event Name</td>
            <td>Event Image</td>
            <td>Event Info</td>
            <td>Date</td>
            <td>Start Time (Local)</td>
            <td>End Time (Local)</td>
            <td>Event Location</td>
            <td>URL</td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for='(event, index) in filteredEvents'
            :key='index'
          >
            <td>{{ event['Event Name'] }}</td>
            <td class="image-cell">{{ event['Event Image'] }}</td>
            <td>{{ event['Event Info'] }}</td>
            <td>{{ event['Date (Local)'] }}</td>
            <td>{{ event['Start Time (Local)'] }}</td>
            <td>{{ event['End Time (Local)'] }}</td>
            <td>{{ event['Event Location'] }}</td>
            <td>{{ event['URL'] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';

  const allEvents = ref([]);
  const allEventsRaw = ref([]);

  const includeOnline = ref(true);
  const includePrivate = ref(true);

  let storedEvents = typeof window !== 'undefined' ? localStorage.getItem('events') : null;

  if (storedEvents) {
    storedEvents = JSON.parse(storedEvents);

    if (storedEvents && storedEvents.length) {
      allEvents.value = storedEvents;
    }
  }

  const resetAll = () => {
    allEvents.value = [];
    allEventsRaw.value = [];

    typeof window !== 'undefined' ? localStorage.setItem('events', JSON.stringify(allEvents.value)) : null;
  }

  const getEvents = async() => {
    resetAll();

    await fetch('/api/getEvents')
      .then(res => {
        return res.json();
      })
      .then(events => {
        allEventsRaw.value = events;
      })
      .catch(error => {
        console.log(error);
      });

    processEvents();
  }

  const processEvents = () => {
    allEvents.value = [];

    for (let x = 0; x < allEventsRaw.value.length; x++) {
      const nextEv = allEventsRaw.value[x];

      let address = 'Online';

      if (nextEv.venue && nextEv.venue.address) {
        const venue = nextEv.venue;

        address = `${venue.name}, ${venue.address.localized_address_display}`;
      }

      const startDateUTC = new Date(nextEv.start.utc);
      const endDateUTC = new Date(nextEv.end.utc);
      const startDateLocal = new Date(nextEv.start.local);
      const endDateLocal = new Date(nextEv.end.local);

      const dateOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      
      const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      const formattedDateUTC = new Intl.DateTimeFormat('en-GB', dateOptions).format(startDateUTC);
      const formattedStartTimeUTC = new Intl.DateTimeFormat('en-GB', timeOptions).format(startDateUTC);
      const formattedEndTimeUTC = new Intl.DateTimeFormat('en-GB', timeOptions).format(endDateUTC);
      const formattedDateLocal = new Intl.DateTimeFormat('en-GB', dateOptions).format(startDateLocal);
      const formattedStartTimeLocal = new Intl.DateTimeFormat('en-GB', timeOptions).format(startDateLocal);
      const formattedEndTimeLocal = new Intl.DateTimeFormat('en-GB', timeOptions).format(endDateLocal);

      allEvents.value.push({
        'Event Name': nextEv.name.text,
        'Event Image': nextEv.logo.original.url,
        'Event Info': nextEv.description.text,
        'Date (UTC)': formattedDateUTC,
        'Start Time (UTC)': formattedStartTimeUTC,
        'End Time (UTC)': formattedEndTimeUTC,
        'Date (Local)': formattedDateLocal,
        'Start Time (Local)': formattedStartTimeLocal,
        'End Time (Local)': formattedEndTimeLocal,
        'Event Location': address,
        'URL': nextEv.url,
      });

      typeof window !== 'undefined' ? localStorage.setItem('events', JSON.stringify(allEvents.value)) : null;
    }
  }

  const filteredEvents = computed(() => {
    return allEvents.value.filter(event => {
      if (!includeOnline.value && event['Event Location'] === 'Online') {
        return false;
      }

      return true;
    });
  });

  const jsonToCsv = (events) => {
    let csv = '';
    let headers = Object.keys(events[0]);
    csv += headers.join(',') + '\n';

    events.forEach(function (row) {
        let data = headers.map(header => JSON.stringify(row[header])).join(',');
        csv += data + '\n';
    });

    return csv;
  }

  const downloadSheet = () => {
    let csvData = jsonToCsv(filteredEvents.value);
    let blob = new Blob([csvData], { type: 'text/csv' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'upcoming-ppp-events.csv';
    document.body.appendChild(a);
    a.click();
  }
</script>

<style lang="css">
  table {
    max-width: 100%;
  }

  tr {
    max-width: 100%;
  }

  td {
    overflow-x: hidden;
  }

  thead td {
    vertical-align: top;
  }
  
  tbody td {
    font-size: 0.8rem;
  }

  .image-cell {
    display: block;
    word-break: break-all;
  }
</style>