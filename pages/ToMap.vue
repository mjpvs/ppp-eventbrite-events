<template>
    <div v-if="isLoading">
      Loading...
    </div>
    <div v-if="!isLoading">
        <div class="map-container">
            <GoogleMap
                style="width: 100%; height: 100%"
                :center="center"
                :zoom="3"
            >
                <AdvancedMarker
                    :options="{position: center}"
                />
            </GoogleMap>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { GoogleMap, AdvancedMarker } from 'vue3-google-map'

    const center = { lat: 51.5, lng: 0 }

    const allEvents = ref([]);
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

    onMounted(() => {
        getEvents();
    })
</script>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        position: absolute;
    }
</style>
