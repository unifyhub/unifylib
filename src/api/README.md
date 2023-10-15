## API Wrapper Guideline

The ServiceName API wrapper is designed to abstract the complexity of interacting with the ServiceName API, allowing for efficient and optimized API usage. Following the guidelines and structure provided, developers can seamlessly integrate the ServiceName API into their projects with reduced setup overhead.

## Getting Started

Begin with the ServiceName API wrapper using these steps:

1. **Create a New Directory**
   ```sh
    mkdir serviceName && cd $_ && touch index.js
   ```

2. **Initialize API Wrapper File**
   Inside your `serviceName` directory, create an `index.js` file where the API wrapper will be implemented.


## API Wrapper Structure

Ensure each API wrapper adheres to the consistent structure:

```javascript
const ServiceName = {
	url: null,
	key: null,

	connect: function (credentials) {
		this.url = credentials.url;
		this.key = credentials.key;
		return this;
	},
  
	_makeRequest: async function (endpoint, method, payload) {
		const url = `${this.url}${endpoint}`;
		const options = {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.key}`
			},
			body: payload
		};
		try {
			const response = await Unify.Requests.fetch(url, options);
			if (!response.ok) {
				throw new Error(`API Request failed with status ${response.status}: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			Unify.Log.error(`Error in _makeRequest: ${error.message}`);
			throw error;
		}
	},

	// ...Additional API methods and schemas...
};

export default ServiceName;
```

See the detailed structure in the API guideline documentation.

## Schema Format

API method schemas should be defined as follows:

```javascript
someMethod: {
	schema: function () {
		return {
			"name": "ServiceName_someMethod",
			"parameters": {
				"type": "object",
				"properties": {
					"requiredParam": {
						"type": "string"
					},
					"optionalParam": {
						"type": "number",
						"default": 0 // default value if optionalParam is not provided
					}
				},
				"required": ["requiredParam"]
			}
		};
	},
	execute: async function (options) {
		const endpoint = `/someEndpoint`;
		const method = 'POST';
		const payload = JSON.stringify(options);
		try {
			const response = await ServiceName._makeRequest(endpoint, method, payload);
			return {
				success: true,
				data: response.data
			};
		} catch (error) {
			console.error('someMethod API Request failed:', error.message);
			return {
				success: false,
				error: error.message
			};
		}
	},
}
```

For a comprehensive understanding of schema formatting, refer to the API guideline documentation.

## Usage Example

Here's an exemplary usage of the `someMethod` API method:

```javascript
import ServiceName from './serviceName';  // Adjust path as needed

// Initialize the API wrapper
const credentials = {
	url: 'https://api.servicename.com',
	key: 'your-api-key',
};
ServiceName.connect(credentials);

const options = {
	requiredParam: 'example-value',
	optionalParam: 42,
};

try {
	const response = await ServiceName.someMethod.execute(options);
	console.log('API Response:', response);
} catch (error) {
	// Handle any errors that occur during the API request
	console.error('API Request failed:', error.message);
}
```

Ensure to replace `your-api-key` with the actual API key provided by ServiceName.