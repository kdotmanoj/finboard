const cache = new Map();
const IN_FLIGHT_REQUESTS = new Map();

export const fetchWithCache = async (url, options = {}) => {
    if (IN_FLIGHT_REQUESTS.has(url)) {
        return IN_FLIGHT_REQUESTS.get(url);
    }

    const cached = cache.get(url);
    const now = Date.now();
    if (cached && (now - cached.timestamp < 10000)) {
        return Promise.resolve(JSON.parse(JSON.stringify(cached.data)));
    }

    const requestPromise = fetch(url, options)
        .then(async (res) => {
            if (!res.ok) throw new Error('Network error');
            const json = await res.json();
            
            if (json.Note || json.Information || json['Error Message']) {
                throw new Error("API Limit Reached");
            }

            cache.set(url, {
                timestamp: Date.now(),
                data: json
            });
            
            return json;
        })
        .finally(() => {
            IN_FLIGHT_REQUESTS.delete(url);
        });

    IN_FLIGHT_REQUESTS.set(url, requestPromise);
    return requestPromise;
};