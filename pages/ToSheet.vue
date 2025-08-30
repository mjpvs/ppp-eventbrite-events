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
    </div>
    <br>
    <div v-if="isLoading">
      Loading...
    </div>
    <div v-if="!isLoading">
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
  import { ref, computed, onMounted } from 'vue';

  const allEvents = ref([]);

  const includeOnline = ref(true);
  const includePrivate = ref(true);
  const isLoading = ref(true);

  const resetAll = () => {
    allEvents.value = [];
  }

  const getEvents = async() => {
    isLoading.value = true;
    
    resetAll();

    await fetch('/api/getEvents')
      .then(res => {
        return res.json();
      })
      .then(events => {
        allEvents.value = events;
        isLoading.value = false;
      })
      .catch(error => {
        console.log(error);
      });
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

  onMounted(() => {
    getEvents();
  })
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