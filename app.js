(async () => {
    const fetch = (await import('node-fetch')).default;
    const args = process.argv.slice(2);
    const token = args[0];
    const city = args[1];
    const url1 = "https://bus-med.1337.ma/api/departure/current";
    const headers1 = {
        "Content-Type": "application/json",
        cookie: `le_token=${token}`
    };
    const fetchDepartures = async () => {
        try {
            const response = await fetch(url1, {
                method: "GET",
                headers: headers1,
            });
            const data = await response.json();
            const tetouanDeparture = data.find(departure =>
                departure.route.name === city &&
                new Date().getHours() >= 2
            );
            if (tetouanDeparture) {
                const paradaId = tetouanDeparture.route.paradas[0]?.id;
                if (paradaId) {
                    return { departureId: tetouanDeparture.id, paradaId };
                } else {
                    console.error(`No parada ID found for route city ===> '${city}'`);
                }
            } else {
                console.error(`No departures for city ===> '${city}'`);
            }
        } catch (error) {
            console.error("Error fetching departures:", error.message);
        }
        return null;
    };
    const bookTicket = async (departureId, paradaId) => {
        const url = "https://bus-med.1337.ma/api/tickets/book";
        const requestBody = {
            departure_id: departureId,
            to_campus: false,
            parada_id: paradaId
        };
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers1,
                body: JSON.stringify(requestBody),
            });
            const data = await response.json();
            if (data.statusCode === 400) {
                console.log("Booking success with status 200. Exiting loop.");
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error booking ticket:", error.message);
        }
        return false;
    };

    while (true) {
        const departureData = await fetchDepartures();
        if (departureData) {
            const { departureId, paradaId } = departureData;
            const bookingSuccess = await bookTicket(departureId, paradaId);
            if (!bookingSuccess) {
                break;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 0.1));
    }
})();
