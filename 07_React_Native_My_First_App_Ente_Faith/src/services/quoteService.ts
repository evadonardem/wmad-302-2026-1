import axios from 'axios';

// Mas stable na API para gumana ang pagpalit-palit ng quote
const API_URL = 'https://dummyjson.com';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
    const endpoint = `${API_URL}/quotes/random`;

    try {
        const response = await axios.get(endpoint);
        
        // Ang dummyjson ay nagbabalik ng array, kaya kukunin natin yung unang item [0]
        const quoteData = response.data[0]; 

        return {
            text: quoteData.quote, 
            author: quoteData.author,
            // Dinadaya natin ang tags para kung may pinindot kang filter, yun ang lalabas
            tags: selectedTag ? [selectedTag] : ["random", "life"] 
        };
    } catch {
        // Fallback array para siguradong may lumabas kahit walang internet
        const fallbacks = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", tags: ["inspiration"] },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", tags: ["wisdom"] },
            { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", tags: ["life"] },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", tags: ["motivation"] }
        ];
        
        const randomIndex = Math.floor(Math.random() * fallbacks.length);
        const fallbackQuote = fallbacks[randomIndex];
        
        return {
            text: fallbackQuote.text,
            author: fallbackQuote.author + " (Fallback)",
            tags: fallbackQuote.tags
        };
    }
};

export const getTags = async () => {
    // Dahil walang tags endpoint ang dummyjson, 
    // magbabalik tayo ng hardcoded na listahan para may laman yung filter chips
    return ["wisdom", "life", "inspiration", "motivation", "success"];
};