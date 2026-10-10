import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export const getRandomQuote = async (selectedTag = null) => {
    // TODO 17 [Dynamic Endpoint Interpolation]
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${selectedTag}`
        : `${API_URL}/quotes/random`;

    try {
        // TODO 18 [Asynchronous Request Handling]
        const response = await axios.get(endpoint);
        const { quote, author, tags } = response.data;
        
        return {
            text: quote,
            author: author,
            tags: tags || []
        };
        
    } catch {
        // TODO 19 [Resilient System Fallbacks]
        return {
            text: "The best way to predict the future is to create it.",
            author: "Unknown",
            tags: ["motivation", "wisdom"]
        };
    }
};

export const getTags = async () => {
    // TODO 20 [Asynchronous List Retrieval]
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch {
        return [];   
    }
};