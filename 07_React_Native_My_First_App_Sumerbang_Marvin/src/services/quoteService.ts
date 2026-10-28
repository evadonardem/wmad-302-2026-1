// src/services/quoteService.ts
import axios from 'axios';

const API_URL = 'https://vercel.app';

export type Quote = {
  text: string;
  author: string;
  tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
  // TODO 17: Dynamic Endpoint Interpolation
let endpoint = `${API_URL}/quotes/random`;
if (selectedTag) {
  endpoint += `?tags=${selectedTag}`;
}

  try {
  // TODO 18: Asynchronous Request Handling
  const response = await axios.get(endpoint);
  const { quote, author, tags } = response.data;
  return {
    text: quote,
    author: author,
    tags: tags || []
  };
}
    // TODO 19: Resilient System Fallbacks
    return {
      text: "An error occurred, but keep pushing forward.",
      author: "System Fallback",
      tags: ["fallback", "motivation"]
    };
  }
};

export const getTags = async () => {
  // TODO 20: Asynchronous List Retrieval
  try {
    const response = await axios.get(`${API_URL}/tags`);
    return response.data || [];
  } catch (error) {
    return [];
  }
};