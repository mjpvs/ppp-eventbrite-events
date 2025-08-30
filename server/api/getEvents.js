import { initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import serviceAccount from '../../.keys/serviceAccountKey.json';

export default defineEventHandler(async() => {
    const { EB_TOKEN, EB_ORG_ID } = useRuntimeConfig();

    let firestoreApp;

    try {
        firestoreApp = getApp();
    } catch (error) {
        firestoreApp = initializeApp({
            projectId: serviceAccount.projectId,
            credential: cert(serviceAccount),
            storageBucket: 'small99-upcoming-events.appspot.com'
        });
    }

    const db = getFirestore();

    const getLastUpdate = async() => {
        try {
            const querySnapshot = await db.collection("lastUpdated")
                    .orderBy("date", "desc")
                    .limit(1)
                    .get();
    
            if (querySnapshot.empty) {
                return null;
            }
    
            const latestDoc = querySnapshot.docs[0];
    
            return latestDoc.data();
        } catch (e) {
            return null;
        }
    }

    const setLastUpdated = async() => {
        try {        
            await db.collection("lastUpdated").add({
                date: Date.now(),
            });
        } catch (e) {
            console.error('Error adding document: ', e);
        }
    }

    const isToday = (input) => {
        const today = new Date();
        const inputDate = new Date(input);

        return inputDate.getDate() === today.getDate() &&
                inputDate.getMonth() === today.getMonth() &&
                inputDate.getFullYear() === today.getFullYear();
    }

    let allEvents = [];

    const processEvents = (rawEvents) => {
        const processed = [];

        for (let x = 0; x < rawEvents.length; x++) {
            const nextEv = rawEvents[x];

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

            processed.push({
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
        }

        return processed;
    }

    const getEventsFromApi = async(continuation) => {
        let apiUrl = `https://www.eventbriteapi.com/v3/organizations/${EB_ORG_ID}/events/?token=${EB_TOKEN}&status=live&expand=venue&page_size=100`;

        if (continuation) {
            apiUrl = `${apiUrl}&continuation=${continuation}`;
        }

        const request = 
            await fetch(apiUrl)
            .then(res => {
                return res.json();
            })
            .then(events => {
                return events;
            })
            .catch(error => {
                console.log(error);
                return error;
            });

        allEvents = allEvents.concat(processEvents(request.events));

        console.log(`Retrieved ${allEvents.length} items`);

        if (request.pagination.has_more_items) {
            await getEventsFromApi(request.pagination.continuation);
        }
    }

    const getEventsFromDB = async() => {
        try {
            const collectionRef = db.collection('events');
            const snapshot = await collectionRef.get();

            if (snapshot.empty) {
                allEvents = [];
            }

            snapshot.forEach(doc => {
                const parsedEvents = JSON.parse(doc.data().eventData)
                allEvents = allEvents.concat(parsedEvents);
            });
        } catch (e) {
            console.error('Error retrieving events:', e);
        }
    }

    const storeEventsInDB = async () => {
        try {
            const collectionRef = db.collection("events");
            const snapshot = await collectionRef.get();

            const deleteBatch = db.batch();
            snapshot.docs.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();

            const chunkSize = 200;

            for (let i = 0; i < allEvents.length; i += chunkSize) {
                const chunk = allEvents.slice(i, i + chunkSize);

                await db.collection("events").add({
                    eventData: JSON.stringify(chunk)
                })
            }
        } catch (e) {
            console.error('Error adding events:', e);
        }
    }

    const handler = async() => {
        const lastUpdate = await getLastUpdate();

        if (lastUpdate && isToday(lastUpdate.date)) {
            console.log('Retrieved today');
            await getEventsFromDB();
        } else {
            console.log('Get afresh');
            await getEventsFromApi();
            await storeEventsInDB();
            await setLastUpdated();
        }

        return allEvents;
    }

    await handler();

    return allEvents;
});
