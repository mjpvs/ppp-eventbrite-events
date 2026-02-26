<template>
    <div v-show="mapLoading">
      <div class="container">
        Loading...
      </div>
    </div>
    <div v-show="!mapLoading">
        <div id="map-container">

        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue';

    const { G_API_KEY, MAP_ID } = useRuntimeConfig().public;

    useHead({
        title: 'People Planet Pint & Pastry Events Map',
        script: [
            {
                src: 'https://kit.fontawesome.com/7643a584c4.js',
                crossorigin: 'anonymous',
            },
        ],
    });

    const center = { lat: 51.5, lng: 0 }

    const allEvents = ref([]);
    const isLoading = ref(true);

    let map = null;

    const eventsLoading = ref(true);
    const mapLoading = ref(true);

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
                eventsLoading.value = false;
            })
            .catch(error => {
                console.log(error);
            });
    }

    const initMap = async() => {
        await google.maps.importLibrary("maps");
        await google.maps.importLibrary("marker");

        map = new google.maps.Map(document.getElementById("map-container"), {
            center: { lat: 20, lng: 0 },
            zoom: 3,
            mapId: MAP_ID,
        });

        mapLoading.value = false;

        addPins();
    }

    onMounted(async() => {
        await getEvents();

        addPins();
    })

    const getPinElement = (eventName) => {
        let bgColour = '#0652DD';
        let iconName = 'beer-mug-empty';

        eventName = eventName.toLowerCase();

        if (eventName.indexOf('board game') !== -1) {
            bgColour = '#ffbe0c';
            iconName = 'dice'
        } else if (eventName.indexOf('wine') !== -1) {
            bgColour = '#ed4c67';
            iconName = 'wine-glass';
        } else if (eventName.indexOf('pastry') !== -1) {
            bgColour = '#ff9900';
            iconName = 'mug-hot';
        } else if (eventName.indexOf('workshop') !== -1) {
            bgColour = '#0242b9';
            iconName = 'gears';
        } else if (eventName.indexOf('walk') !== -1) {
            bgColour = '#1ca379';
            iconName = 'person-walking'
        } else if (eventName.indexOf('book club') !== -1) {
            bgColour = '#ff9900';
            iconName = 'book'
        } else if (eventName.indexOf('presents') !== -1) {
            bgColour = '#1ca379';
            iconName = 'person-chalkboard'
        }

        const pin = new google.maps.marker.PinElement({
            background: bgColour,
            borderColor: bgColour,
            glyphColor: bgColour,
        });

        pin.classList.add('fa-solid');
        pin.classList.add(`fa-${iconName}`);

        return pin;
    }

    const addPins = () => {
        if (!eventsLoading.value && !mapLoading.value) {
            for (let x = 0; x < allEvents.value.length; x++) {
                const nextEv = allEvents.value[x];
                
                if (nextEv.lat && nextEv.lon) {

                    const iconContent = getPinElement(nextEv['Event Name']);

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        map,
                        position: {
                            lat: Number.parseFloat(nextEv.lat),
                            lng: Number.parseFloat(nextEv.lon),
                        },
                        title: nextEv['Event Name'],
                        content: iconContent,
                    });

                    marker.addEventListener('click', () => {
                        window.open(nextEv.URL, '__blank').focus();
                    });
                }
            }


        }
    }

    if (process.client) {
        useHead({
            script: [
                {
                    src: `https://maps.googleapis.com/maps/api/js?key=${G_API_KEY}&v=weekly`,
                    async: true,
                    defer: true,
                    onload: initMap,
                },
            ],
        });
    }
</script>

<style>
    #map-container {
        width: 100%;
        height: 100%;
        position: absolute;
    }

    gmp-advanced-marker {
        cursor: pointer;
    }

    gmp-pin.fa-solid::before {
        color: white;
        z-index: 1;
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: .9rem;
    }
</style>
