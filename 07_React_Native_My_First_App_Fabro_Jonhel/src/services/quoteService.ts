import axios from 'axios';

const API_URL = 'https://vercel.app';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
   
    const endpoint = `${API_URL}/quotes/random` + (selectedTag ? `?tags=${selectedTag}` : '');

    try {
      
        const response = await axios.get<{ quote: string; author: string; tags: string[] }>(endpoint);
        const { quote, author, tags } = response.data;
        return { text: quote, author, tags };
    } catch {
       
        return {
            
            text: 'Could not load a quote right now. Please check your connection and try again.',
            author: 'Quote Generator',
            tags: [],
        };
    }
};


export const getTags = async () => {
    
    try {

        const response = await axios.get<string[]>(`${API_URL}/tags`);
        return response.data;
    } catch {
    
        return [];
    }
};