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

    const center = { lat: 51.5, lng: 0 }

    const allEvents = ref([]);
    const isLoading = ref(true);

    let map = null;

    const eventsLoading = ref(true);
    const mapLoading = ref(true);

    const pintIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAqCAYAAACk2+sZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAS7SURBVHgBvZhNbBtFFMffzHpNWqexKxqK4BCbBFBV1CYHwgWF+FAuQOoUqZwoGAESUqoQEakXIDHtgUOkpgqciiBqOQAVweXjAocYjlzyISEOFLxB/VBbVbHTJm288UzfG2fdtb27XjdpflKS9cxk/vPevPdm1gz8kJiJBKC5k3F+kEnolQyiDCBCXRIgB5LNApMGE/J8Id2R9jMlqycY5JFBCeJ9S8gHBi4mY4pCCtJ7DGhUWH81OwhSjDYg6LAAmTKnOibBlzBaqfOWk9jxJmwCaP24OdU+5C1MrtVapnF0p9tEkRCHttYAhPHvvFGA3LIAH+qzBbkUh3RXzmoK2Pt1HhlB97qKfvTaThh4KazELc5O34Tj3y3CwrU1cIVBp85aTpoAyXtNlijuKZNi3EmsZ+82iGznsC8WVEI//rmiLH093gx9z4Ugf0vAgZHL3uIlsaHVqfbxe8KJv6M6D85UB9LYWw/DUbRwLluA/ShKYruPGBWT0WJ+++QxmM+uwoGPr0AdcgWxFCOXK5+h6IhT9JIoWdg9fBEnvaxcTAuwM4+Lmvgpr7wy8HIY2h4JeAlHdLZjtGRxIou5KhadRl09G1VuXLi+BmdwAXMYTGRZNX3dITh3bHfJJPTKi7hIGutlNdehmHDqVSvHXAg3lwLpi4FWXKV0nmm5qP6+/dl1yK8ItUUeYLqGEgGmsYNO8314eKeahFxMQUMLcQseSqvj3y6qbaFUo4D0goH2QgA1o07lKxLSlNvsYueOPVqRShYL10yVUrS4I/EdXm626NW0PYOfonBTdc/Tj+tw+PlmYKxUND5/dxf0PLNN7Xc1tMdHMbDoh8ae/nVJtZPH7pjO28OCh/6Vbss6jftKFhA5nOTEN4sw8Uu+ZhxZ+gqK748Gy+MtTqAnaBuq4eAB7RlBQUN7TRarkolCltvpeSy5C77Gsdb4D766oXKaMoFipWdvk6OwAXWgfabK1de9HfZFH1IB5PRsQbn9x1+34R1cMP0vbUEVBscQm4UHCMVEGAPVjpQMhaWYgy2GseLvXAjIwBZDmnwt/WRG3Zu2DoM0VVQzEKfgAUHBl18vqetk6Jc6SqQIpBkXI7BJ0AkWCTGVfpRuVNUsuOCpsrCZjs3q/RcyjLFet8nyK7Lus8VYsnRIUNEZ/vJGOb8xnM/fSceMsnCpTaa8hOfwOHx2+FL5WHR6tgoFFRDK5XljteJOJqQs33Aqzge0etouTpXp6pkoXnWWYeLnPNSDCgXV7afe+7/mJMPczZg/PBG3PgcqOyutptVSnaVjjib0g9vFT5Msado+15yIwf4Lk5jhb9jbKEDaWnWoR7VrbUwWptqT4CXclMhGi1zMbOANogKqEZrgXVZQWdScTjQAG1OwSaABp6pF19ud0fv/m2FMul7ufWKgi2NOHe7nMQYDbBAsFnHXPrcOKip084f7J+XkYgvv92OozW2fuLrYwvPqQ2hSSzZ4ehleLvYtrNwlpG+X08u4l4t9CxNmumMSq5qfo9P1G4Bq6u6xHc/9xrtb4fv2LvCJL4staL/B+VZq8CLvhwZoyGJCT2Q7MUGn7V83OZXEejRkMUH5XRlscqhR0Q0RPPTPKL7+jMJ9chcF+RMIjaeyJQAAAABJRU5ErkJggg==";
    const pastryIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAqCAYAAACk2+sZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAPySURBVHgBrVg9UxNBGH7uiLHRmSg22BAabHAMQ6UNSaOVQ9BKm4TGj7EAfgHhFxAKhwkN4QdocOxsOBo6BhipbHIVNIAZtRCEnO+7e8nlvvcCz8xNNrd7++w+78e+dxoUYK0hg7/IIYUpWMjTlaXbGbu7BQ179GvS/S/aW2yozKnFEl5gFm3M9RDFwaRZDVxiUXtP7aTE1ioRWqgkIPQvoC3I61AhFrv8hyUiLeN6UCX55yOJbdJNIs1BBbeyQH4NuJ8HvhaAIyN4HPvADRS0GfIHG7prwDkWEpE+3wRO94H1O+GkDJ6TVexBl1jYFMKJ1DAyBZwQ6TY9ctaKH0+ms2rO/EJqa4XCQ8cuVB1pYgEYs+c4qAI7i1BEC2mMsORyxwMksSppmoZNVIDP4/LidlrZ8TM4E5ECXThUEg++mZHSZovA7Sz5RUveU4WGEnNqJHOZZF6LfaDjTEHgHfMCvk2T3fcQizZmUiQzp8F4FGhtB8vA92pwP0v+ZEmGVRwGMJmy8240WFLesdlw/ntxaACjJdn320QkKN+n6CcbOoDJnjXkL0s5RLtJk5RPG+GTvtiVY3nnf8ywUWTjWoTQedv0xgwS4XFVBup2eFpIhfaww7Bs5kawtGFgmdnBxmYjh/GOm/DKfTcnPfhcISN58Yli+0HZIQ72dFOjVNkgsYuu26+a0R6siqE8yb4kE00vLBg6Hdj7vgdY5qZSIRENlv1ewJljYYttbNC14Or4sQ68buJawMr5YchDooaf8Obq0bKUiUOCbcQhxas3bSUG7Z107DdclEejCLu8dEg+PHYqXlKTCoMR6dVtLFPa9Oy6Tk5Sco4+nujlrhNaE/aEnYlLRUnEC2HH5HzuJ4Wox9A5jwdCKsNjIh185PwXITbsH8f3+aDoZCyOitOQnE1FYJdYe0Olib0SFw4NR9LOpOk7/sl4DEvMF7d5ESd+nxXlr1156t6VuMA2492wzRhnLWchvWDb/zJlm32BcbwXRNyNT3extyoKvbxrMMc02413wEmB20dbtJhJe3F2m32Ao4HbXPytal5SQ3uHQjDxCpHqcB+6D+ekdycBO6Y3v7ep5Okp8P119QoV4DpKuE5oqJMfuVaiBwyrAOgjSYeiFeQ/PmJbDuWyMRaUI4LeocLfnWqi3M3hahBZKqhDD33kAglP/wC0EVqAhRJrH8Q77zz6J+3vNbWDwNiOR6jEHeiIw6WQPImXm1ESKxMLudoJJI+RWJnYJq+T3MuxAyO+APjmRAJE2ptevik7jUMRSjvuQtrbDOgxqW8aCZBoxwzro/jsxAeJ87mpjXEVu/Yi2Y5hx3evs1E7KemVQKdYhS/0if8BGF1znO4uYAAAAABJRU5ErkJggg==";

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

    const addPins = () => {
        if (!eventsLoading.value && !mapLoading.value) {
            for (let x = 0; x < allEvents.value.length; x++) {
                const nextEv = allEvents.value[x];
                
                if (nextEv.lat && nextEv.lon) {
                    const isPastry = nextEv['Event Name'].indexOf('Pastry') !== -1;

                    const iconImage = new Image();
                    iconImage.src = isPastry ? pastryIcon : pintIcon;

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        map,
                        position: {
                            lat: Number.parseFloat(nextEv.lat),
                            lng: Number.parseFloat(nextEv.lon),
                        },
                        title: nextEv['Event Name'],
                        content: iconImage,
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
</style>
