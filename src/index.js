import GitHub from './api/github/index.js'
import OpenAI from './api/openai/index.js'
import {Unify} from './unify/utils.js'


const CREDS = {
  GITHUB_API_KEY:"",
  OPENAI_API_KEY:"",
  APP_SHEETS_API_KEY:"",
  APP_SHEETS_ID:"",
}

export {CREDS, GitHub, OpenAI, Unify}