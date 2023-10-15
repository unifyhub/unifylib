import Unify from '../../globals.js';

// Unused function - commented out
// const convertToString = (input) => (
//   (typeof input === 'object' || Array.isArray(input)) ? JSON.stringify(input) : String(input)
// );

function buildPayload(options) {
  const payload = {
    model: options.model || 'gpt-3.5-turbo',
    messages: options.messages,
  };

  [
    'temperature', 'top_p', 'n', 'stream', 'stop', 'max_tokens',
    'presence_penalty', 'frequency_penalty', 'logit_bias',
    'user', 'functions', 'function_call',
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(options, key)) payload[key] = options[key];
  });

  if (!payload.functions && payload.function_call) {
    throw new Error("Cannot use 'function_call' without specifying 'functions'.");
  }
  return payload;
}

async function processFunctionCall(responseMessage, options, depth) {
  const availableFunctions = options.availableFunctions || {};
  const responseParser = options.functionResponseParser || {};
  const functionName = responseMessage.function_call.name;
  const functionResponseParser = responseParser[functionName] || ((response) => JSON.stringify(response));
  const functionArgs = responseMessage.function_call.arguments;
  const functionToCall = availableFunctions[functionName];

  if (typeof functionToCall !== 'function') {
    return `Error: Function "${functionName}" is not available or not a function.`;
  }

  const parsedFunctionArgs = JSON.parse(functionArgs);
  const functionResponse = await functionToCall(parsedFunctionArgs);
  options.messages.push(responseMessage);
  options.messages.push({
    role: 'function',
    name: functionName,
    content: functionResponseParser(functionResponse),
  });

  // eslint-disable-next-line no-use-before-define
  return OpenAI.chatGpt.execute(options, depth + 1);
}

async function processResponse(jsonResponse, options, depth) {
  if (jsonResponse.choices && jsonResponse.choices.length > 0) {
    const responseMessage = jsonResponse.choices[0].message;

    if (responseMessage.function_call) {
      return processFunctionCall(responseMessage, options, depth);
    }
    return responseMessage.content;
  }
  if (jsonResponse.error) {
    return `Error: ${jsonResponse.error.message}`;
  }
  return null;
}

const OpenAI = {
  url: null,
  key: null,

  connect(credentials) {
    OpenAI.url = credentials.url;
    OpenAI.key = credentials.key;
  },

  isConnected() {
    return OpenAI.url !== null && OpenAI.key !== null;
  },

  chatGpt: {
    schema() {
      return {
        name: 'chatGpt',
        description: 'Chat with the GPT model and execute functions',
        parameters: {
          model: {
            type: 'string',
            description: "The GPT model to use (e.g., 'gpt-3.5-turbo')",
            default: 'gpt-3.5-turbo',
          },
          messages: {
            type: 'array',
            description: 'An array of message objects for the conversation',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  description: "The role of the message sender (e.g., 'system', 'user', 'assistant', 'function')",
                  enum: ['system', 'user', 'assistant', 'function'],
                },
                content: {
                  type: 'string',
                  description: 'The content of the message',
                },
              },
              required: ['role', 'content'],
            },
          },
          temperature: {
            type: 'number',
            description: 'The temperature for randomness in response (e.g., 0.7)',
            default: 1.0,
          },
          top_p: {
            type: 'number',
            description: 'The nucleus sampling parameter (e.g., 0.8)',
          },
          n: {
            type: 'integer',
            description: 'The number of completions to generate (e.g., 1)',
          },
          stream: {
            type: 'boolean',
            description: 'Whether to stream the response',
          },
          stop: {
            type: 'string',
            description: "Stop sequence to limit the response (e.g., '\\n')",
          },
          max_tokens: {
            type: 'integer',
            description: 'The maximum number of tokens in the response',
          },
          presence_penalty: {
            type: 'number',
            description: 'The presence penalty for certain tokens',
          },
          frequency_penalty: {
            type: 'number',
            description: 'The frequency penalty for certain tokens',
          },
          logit_bias: {
            type: 'object',
            description: "Logit bias for modifying the model's behavior",
          },
          user: {
            type: 'string',
            description: 'Additional user context for the conversation',
          },
          functions: {
            type: 'object',
            description: 'Available custom functions for execution',
          },
          function_call: {
            type: 'object',
            description: 'Details of the function call',
          },
          retries: {
            type: 'integer',
            description: 'The number of retries in case of API failure',
            default: 3,
          },
        },
        required: ['messages'],
      };
    },

    async execute(options, depth = 0) {
      const MAX_DEPTH = 5;
      const MAX_RETRIES = options.retries || 1;
      const apiUrl = OpenAI.url;

      if (depth >= MAX_DEPTH) return 'Error: Max recursive depth reached.';

      const payload = buildPayload(options);
      const requestOptions = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OpenAI.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await Unify.Request.fetch(apiUrl, requestOptions);

          if (response.status === 200) {
            // eslint-disable-next-line no-await-in-loop
            const jsonResponse = JSON.parse(await response.text());
            return processResponse(jsonResponse, options, depth);
          }
          // eslint-disable-next-line no-await-in-loop
          Unify.Log.error(`Error response on attempt ${attempt + 1}: ${await response.text()}`);
        } catch (error) {
          Unify.Log.error('Error on attempt', attempt + 1, ':', error.message);
        }
      }
      return `Error: Unknown error after ${MAX_RETRIES} retries.`;
    },
  },
};

export default OpenAI;
