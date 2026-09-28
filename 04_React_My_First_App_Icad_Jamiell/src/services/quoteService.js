import axios from 'axios';

const API_URL = 'https://dummyjson.com/quotes';

export const getRandomQuote = async () => {
    const endpoint = `${API_URL}/random`;

    try {
        const { data } = await axios.get(endpoint);
        return {
            text: data.quote,
            author: data.author,
            tags: data.tags,
        };
        
    } catch {
        return {
            text: 'Unable to load a quote right now.',
            author: 'Quote service',
            tags: [],
        };
    }
};

export const getTags = async () => {
    return [];
}
