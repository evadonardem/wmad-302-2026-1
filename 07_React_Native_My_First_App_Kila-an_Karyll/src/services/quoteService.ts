import axios from 'axios';

const API_URL = 'https://vercel.app';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
    const basePath = `${API_URL}/quotes/random`;
    const endpoint = selectedTag
        ?`${basePath}?tags=${selectedTag}`
        :basePath;

    try {
        
        const response = await axios.get(endpoint);
        const {quote, author, tags } = response.data;
        return {
            text: quote,
            author: author,
            tags: tags || [],
        };
    } catch {
    
        return {
            text:'Success begins with hard work and perseverance.',
            author:'Proverb',
            tags:['fallback'],
        };
    }
};

export const getTags = async () => {
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch {
        return [];
    }
};
