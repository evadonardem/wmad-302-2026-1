import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export const getRandomQuote = async (selectedTag = null) => {
    // TODO 17 [Dynamic Endpoint Interpolation]: Formulate the dynamic target endpoint string URL.
    // If a truthy 'selectedTag' value is provided, append '?tags=[selectedTag]' to the base random path URL.
    // Example Target: 'https://quoteslate.vercel.app/api/quotes/random?tags=wisdom'

    const queryParam = selectedTag ? `?tags=${selectedTag}` : '';
    const endpoint = `${API_URL}/quotes/random${queryParam}`;

    try {
        // TODO 18 [Asynchronous Request Handling]:
        // a. Execute an asynchronous GET network request using Axios targeting your calculated endpoint URL.
        // b. Extract the 'quote', 'author', and 'tags' properties from the resulting payload object.
        // c. Return a clean object structured with uniform mapping matching: { text: [extracted quote text], author, tags }

        // [Your code here]
        const response = await axios.get(endpoint);
        const { quote, author, tags } = response.data;

        return {
            text: quote,
            author,
            tags,
        };

    } catch {
        // TODO 19 [Resilient System Fallbacks]: Return a hardcoded fallback quote object
        // with custom placeholder messages if an unexpected API or network timeout exception is encountered.

        // [Your fallback code here]
        return {
            text: 'Unable to load quote. Please try again later.',
            author: 'Unknown',
            tags: ['No Tags Available'],
        };
    }
};

export const getTags = async () => {
    // TODO 20 [Asynchronous List Retrieval]:
    // Fetch global category strings from the API endpoint path `${API_URL}/tags` using Axios.
    // Return the response data array on success, or return an empty array fallback inside the catch safety layer.

    const endpoint = `${API_URL}/tags`;

    try {
        // [Your code here]
        const response = await axios.get(endpoint);
        return response.data;

    } catch {
        // [Your code here]
        return [];
    }
};