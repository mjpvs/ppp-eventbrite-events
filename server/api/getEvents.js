export default defineEventHandler(async() => {
    const { EB_TOKEN, EB_ORG_ID } = useRuntimeConfig();

    let allEvents = [];

    const getEvents = async(continuation) => {
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

        
        allEvents = allEvents.concat(request.events);

        console.log(`Retrieved ${allEvents.length} items`);

        if (request.pagination.has_more_items) {
            await getEvents(request.pagination.continuation);
        }
    }

    await getEvents();

    return allEvents;
});
