OpenAI = {
		url: null,
		key: null,

		connect: function (credentials) {
			this.url = credentials.url;
			this.key = credentials.secret;
			return this;
		},

		isConnected: function () {
			return this.url !== null && this.key !== null;
		},

		chatGpt: {
			schema: function () {
				return {
					name: "chatGpt",
					description: "Chat with the GPT model and execute functions",
					parameters: {
						model: {
							type: "string",
							description: "The GPT model to use (e.g., 'gpt-3.5-turbo')",
							default: "gpt-3.5-turbo",
						},
						messages: {
							type: "array",
							description: "An array of message objects for the conversation",
							items: {
								type: "object",
								properties: {
									role: {
										type: "string",
										description:
											"The role of the message sender (e.g., 'system', 'user', 'assistant', 'function')",
										enum: ["system", "user", "assistant", "function"],
									},
									content: {
										type: "string",
										description: "The content of the message",
									},
								},
								required: ["role", "content"],
							},
						},
						temperature: {
							type: "number",
							description: "The temperature for randomness in response (e.g., 0.7)",
							default: 1.0,
						},
						top_p: {
							type: "number",
							description: "The nucleus sampling parameter (e.g., 0.8)",
						},
						n: {
							type: "integer",
							description: "The number of completions to generate (e.g., 1)",
						},
						stream: {
							type: "boolean",
							description: "Whether to stream the response",
						},
						stop: {
							type: "string",
							description: "Stop sequence to limit the response (e.g., '\\n')",
						},
						max_tokens: {
							type: "integer",
							description: "The maximum number of tokens in the response",
						},
						presence_penalty: {
							type: "number",
							description: "The presence penalty for certain tokens",
						},
						frequency_penalty: {
							type: "number",
							description: "The frequency penalty for certain tokens",
						},
						logit_bias: {
							type: "object",
							description: "Logit bias for modifying the model's behavior",
						},
						user: {
							type: "string",
							description: "Additional user context for the conversation",
						},
						functions: {
							type: "object",
							description: "Available custom functions for execution",
						},
						function_call: {
							type: "object",
							description: "Details of the function call",
						},
						retries: {
							type: "integer",
							description: "The number of retries in case of API failure",
							default: 3,
						},
					},
					required: ["messages"],
				};
			},

			execute: function (options) {
				// Construct the payload based on provided options
				var payload = {
					"model": options.model || "gpt-3.5-turbo",
					"messages": options.messages,
				};

				// Add optional properties to the payload only if they are provided in options
				["temperature", "top_p", "n", "stream", "stop", "max_tokens", "presence_penalty", "frequency_penalty", "logit_bias", "user", "functions", "function_call"].forEach(function (key) {
					if (options.hasOwnProperty(key)) {
						payload[key] = options[key];
					}
				});

				var apiUrl = API.OpenAI.url;
				var headers = {
					"Authorization": "Bearer " + API.OpenAI.key,
					"Content-Type": "application/json",
				};

				var requestOptions = {
					"method": "POST",
					"headers": headers,
					"payload": JSON.stringify(payload),
					"muteHttpExceptions": true,
				};

				var maxRetries = options.retries || 3;
				var attempt = 0;
				var jsonResponse = null;

				while (attempt < maxRetries) {
					var response = UrlFetchApp.fetch(apiUrl, requestOptions);
					jsonResponse = JSON.parse(response.getContentText());

					if (jsonResponse.choices && jsonResponse.choices.length > 0) {
						const responseMessage = jsonResponse.choices[0].message;

						if (responseMessage.function_call) {
							// Use provided availableFunctions or fallback to empty object
							const availableFunctions = options.availableFunctions || {};

							const functionName = responseMessage.function_call.name;
							const functionArgs = responseMessage.function_call.arguments;
							const functionToCall = availableFunctions[functionName];

							// Check if the function exists and is callable
							if (typeof functionToCall === "function") {
								const functionResponse = functionToCall(functionArgs);
								options.messages.push(responseMessage);
								options.messages.push({
									"role": "function",
									"name": functionName,
									"content": functionResponse,
								});

								// Recursive call to continue the conversation with the updated messages
								return API.OpenAI.chatGpt.execute(options);
							} else {
								return `Error: Function "${functionName}" is not available or not a function.`;
							}
						} else {
							return responseMessage.content;
						}
					} else {
						attempt++;
					}
				}
				return "Error: " + (jsonResponse.error ? jsonResponse.error.message : "Unknown error after " + maxRetries + " retries.");
			},
		},
};
