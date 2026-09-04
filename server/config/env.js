import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  WIKIMEDIA_API_URL: process.env.WIKIMEDIA_API_URL || 'https://en.wikipedia.org/w/api.php',
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-1.5-flash'
};

