
import axios from 'axios';

const API_URL = 'https://vercel.app';

export type Quote = {
  text: string;
  author: string;
  tags: string[];
};

export const getRandomQuote = async (
  selectedTag: string | null = null
): Promise<Quote> => {
  const endpoint = selectedTag
    ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
    : `${API_URL}/quotes/random`;

  try {
    const response = await axios.get(endpoint);

    const { quote, author, tags } = response.data;

    return {
      text: quote,
      author,
      tags,
    };
  } catch {
    return {
      text: 'Keep learning, keep growing, and never give up.',
      author: 'Unknown',
      tags: ['motivation'],
    };
  }
};

export const getTags = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_URL}/tags`);
    return response.data;
  } catch {
    return [];
  }
};
