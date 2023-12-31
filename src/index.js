import Unify from './globals.js';
import GitHub from './api/github/index.js';
import OpenAI from './api/openai/index.js';

const CREDS = {
  GITHUB_API_KEY: '',
  OPENAI_API_KEY: '',
  APP_SHEETS_API_KEY: '',
  APP_SHEETS_ID: '',
};

export {
  CREDS, GitHub, OpenAI, Unify,
};
