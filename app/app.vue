<template>
  <div>
    <h1>Events</h1>
    <div>
      <button @click='getEvents'>Get Events</button>
      <button @click='downloadSheet'>Download Sheet</button>
      <button @click='resetAll'>Reset</button>
    </div>
    <div>
      <h2>Total: {{ allEvents.length }}</h2>
      <ul>
        <li v-for='(event, index) in allEvents' :key='index'>{{ event }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';

  const allEvents = ref([]);
  const allEventsRaw = ref([]);

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

  const jsonToCsv = () => {
    let csv = '';
    let headers = Object.keys(allEvents.value[0]);
    csv += headers.join(',') + '\n';

    allEvents.value.forEach(function (row) {
        let data = headers.map(header => JSON.stringify(row[header])).join(',');
        csv += data + '\n';
    });

    return csv;
  }

  const downloadSheet = () => {
    let csvData = jsonToCsv();
    let blob = new Blob([csvData], { type: 'text/csv' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'upcoming-ppp-events.csv';
    document.body.appendChild(a);
    a.click();
  }
</script>

<style>
  textarea {
    width: 500px;
    height: 500px;
    overflow: scroll;
  }
</style>