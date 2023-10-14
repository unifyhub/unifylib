import {Unify} from "../../unify/utils.js";

const GitHub = {
	url: null,
	key: null,

	connect: function (credentials) {
		GitHub.url = credentials.url;
		GitHub.key = credentials.key;
	},

	isConnected: function () {
		return GitHub.url !== null && GitHub.key !== null;
	},

	_makeRequest: async function (endpoint, method, payload) {
		var headers = {
			"Authorization": "Bearer " + GitHub.key,
			"Accept": "application/vnd.github+json",
			"Content-Type": "application/json"
		};

		var options = {
			"method": method,
			"headers": headers,
			"muteHttpExceptions": true
		};

		if (payload) {
			options.body = JSON.stringify(payload);
		}

		try {
			const response = await Unify.Request.fetch(GitHub.url + endpoint, options);
			return JSON.parse(await response.text());
		} catch (error) {
			console.error("Error during request to", endpoint, ":", error.message);
			throw error; // or handle error as appropriate for your use case
		}
	},

	addFile: {
		schema: function () {
			return {
				"name": "API.GitHub.addFile",
				"description": "Add a new file to the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"path": {
							"type": "string",
							"description": "The file path, e.g., 'folder/file.txt'",
						},
						"content": {
							"type": "string",
							"description": "The content of the file as a string",
						},
						"commitMessage": {
							"type": "string",
							"description": "The commit message for adding the file",
						},
						"branch": {
							"type": "string",
							"description": "The name of the branch where the file will be added",
						}
					},
					"required": ["path", "content", "commitMessage", "branch"],
				}
			};
		},
		execute: async function (options) {
			try {
				var endpoint = "/contents/" + options.path;
				var payload = {
					"message": options.commitMessage,
					"content": Utilities.base64Encode(options.content),
					"branch": options.branch
				};
				// Awaiting the asynchronous _makeRequest method
				return await GitHub._makeRequest(endpoint, "PUT", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error; // or handle error accordingly
			}
		},
	},

	editFile: {
		schema: function () {
			return {
				"name": "API.GitHub.editFile",
				"description": "Edit a file in the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"path": {
							"type": "string",
							"description": "The file path to be edited, e.g., 'folder/file.txt'",
						},
						"message": {
							"type": "string",
							"description": "The commit message for the edit",
						},
						"content": {
							"type": "string",
							"description": "The new content of the file as a string",
						},
						"sha": {
							"type": "string",
							"description": "The SHA of the existing file to be edited",
						},
						"branch": {
							"type": "string",
							"description": "The name of the branch containing the file",
						}
					},
					"required": ["path", "message", "content", "sha", "branch"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/contents/" + options.path;
			var payload = {
				"message": options.message,
				"content": Utilities.base64Encode(options.content),
				"sha": options.sha,
				"branch": options.branch
			};
			// Await here to resolve the Promise before returning from this function
			try {
				return await GitHub._makeRequest(endpoint, "PUT", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error; // or handle it in some other way
			}
		},
	},

	deleteFile: {
		schema: function () {
			return {
				"name": "API.GitHub.deleteFile",
				"description": "Delete a file from the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"path": {
							"type": "string",
							"description": "The file path to be deleted, e.g., 'folder/file.txt'",
						},
						"commitMessage": {
							"type": "string",
							"description": "The commit message for the deletion",
						},
						"sha": {
							"type": "string",
							"description": "The SHA of the file to be deleted",
						},
						"branch": {
							"type": "string",
							"description": "The name of the branch containing the file",
						}
					},
					"required": ["path", "commitMessage", "sha", "branch"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/contents/" + options.path;
			var payload = {
				"message": options.commitMessage,
				"sha": options.sha,
				"branch": options.branch
			};
			try {
				return await GitHub._makeRequest(endpoint, "DELETE", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error; // or handle error as suitable for your use case
			}
		},
	},

	createPullRequest: {
		schema: function () {
			return {
				"name": "API.GitHub.createPullRequest",
				"description": "Create a new pull request",
				"parameters": {
					"type": "object",
					"properties": {
						"title": {
							"type": "string",
							"description": "The title of the pull request",
						},
						"headBranch": {
							"type": "string",
							"description": "The name of the branch with changes",
						},
						"targetBranch": {
							"type": "string",
							"description": "The name of the branch to merge into",
						},
						"body": {
							"type": "string",
							"description": "The description of the pull request",
						}
					},
					"required": ["title", "headBranch", "targetBranch", "body"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/pulls";
			var payload = {
				"title": options.title,
				"head": options.headBranch,
				"base": options.targetBranch,
				"body": options.body
			};
			try {
				return await GitHub._makeRequest(endpoint, "POST", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error; // or handle error accordingly
			}
		},

	},

	getIssue: {
		schema: function () {
			return {
				"name": "API.GitHub.getIssue",
				"description": "Retrieve a specific issue by its number",
				"parameters": {
					"type": "object",
					"properties": {
						"issueNumber": {
							"type": "integer",
							"description": "The issue number to retrieve",
						}
					},
					"required": ["issueNumber"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/issues/" + options.issueNumber;
			try {
				return await GitHub._makeRequest(endpoint, "GET");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error; // or handle error as suitable for your use case
			}
		},

	},

	closeIssue: {
		schema: function () {
			return {
				"name": "API.GitHub.closeIssue",
				"description": "Close a specific issue",
				"parameters": {
					"type": "object",
					"properties": {
						"issueNumber": {
							"type": "integer",
							"description": "The issue number to close",
						},
						"branch": {
							"type": "string",
							"description": "The branch associated with the issue",
						}
					},
					"required": ["issueNumber", "branch"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/issues/" + options.issueNumber;
			var payload = {
				"state": "closed",
				"branch": options.branch
			};

			try {
				return await GitHub._makeRequest(endpoint, "PATCH", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	listBranches: {
		schema: function () {
			return {
				"name": "API.GitHub.listBranches",
				"description": "List all branches in the repository",
				"parameters": {}
			};
		},
		execute: async function () {
			var endpoint = "/branches";

			try {
				return await GitHub._makeRequest(endpoint, "GET");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	listCommits: {
		schema: function () {
			return {
				"name": "API.GitHub.listCommits",
				"description": "List all commits on a branch or in the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"branch": {
							"type": "string",
							"description": "The branch name to list commits from",
						}
					},
					"required": ["branch"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/commits";
			if (options.branch) {
				endpoint += "?sha=" + options.branch;
			}
			try {
				return await GitHub._makeRequest(endpoint, "GET");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	getCommit: {
		schema: function () {
			return {
				"name": "API.GitHub.getCommit",
				"description": "Retrieve a specific commit by its SHA",
				"parameters": {
					"type": "object",
					"properties": {
						"sha": {
							"type": "string",
							"description": "The SHA of the commit to retrieve",
						}
					},
					"required": ["sha"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/commits/" + options.sha;
			try {
				return await GitHub._makeRequest(endpoint, "GET");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	createBranch: {
		schema: function () {
			return {
				"name": "API.GitHub.createBranch",
				"description": "Create a new branch in the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"newBranchName": {
							"type": "string",
							"description": "The name of the new branch to create",
						},
						"startPointSha": {
							"type": "string",
							"description": "The SHA of the commit to start the branch from",
						}
					},
					"required": ["newBranchName", "startPointSha"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/git/refs";
			var payload = {
				"ref": "refs/heads/" + options.newBranchName,
				"sha": options.startPointSha
			};
			try {
				return await GitHub._makeRequest(endpoint, "POST", payload);
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	deleteBranch: {
		schema: function () {
			return {
				"name": "API.GitHub.deleteBranch",
				"description": "Delete a specific branch from the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"branchName": {
							"type": "string",
							"description": "The name of the branch to delete",
						}
					},
					"required": ["branchName"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/git/refs/heads/" + options.branchName;

			try {
				return await GitHub._makeRequest(endpoint, "DELETE");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},

	},

	listTags: {
		schema: function () {
			return {
				"name": "API.GitHub.listTags",
				"description": "List all tags in the repository",
				"parameters": {}
			};
		},
		execute: async function (options) {
			var endpoint = "/tags";

			try {
				return await GitHub._makeRequest(endpoint, "GET");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	createWebhook: {
		schema: function () {
			return {
				"name": "API.GitHub.createWebhook",
				"description": "Create a new webhook for the repository",
				"parameters": {
					"type": "object",
					"properties": {
						"config": {
							"type": "object",
							"description": "The configuration for the webhook",
						}
					},
					"required": ["config"],
				}
			};
		},
		execute: function (options) {
			var endpoint = "/hooks";
			var payload = {
				"name": "web",
				"config": options.config,
				"events": ["push", "pull_request"],
				"active": true
			};
			return GitHub._makeRequest(endpoint, "POST", payload);
		},
	},

	deleteWebhook: {
		schema: function () {
			return {
				"name": "API.GitHub.deleteWebhook",
				"description": "Delete a specific webhook by its ID",
				"parameters": {
					"type": "object",
					"properties": {
						"hookId": {
							"type": "integer",
							"description": "The ID of the webhook to delete",
						}
					},
					"required": ["hookId"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/hooks/" + options.hookId;

			try {
				return await GitHub._makeRequest(endpoint, "DELETE");
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

	getFileContent: {
		schema: function () {
			return {
				"name": "API.GitHub.getFileContent",
				"description": "View the content of a specific file",
				"parameters": {
					"type": "object",
					"properties": {
						"path": {
							"type": "string",
							"description": "The file path to view",
						},
						"branch": {
							"type": "string",
							"description": "The branch name to view the file from",
						}
					},
					"required": ["path", "branch"],
				}
			};
		},
		execute: async function (options) {
			var endpoint = "/contents/" + options.path;

			if (options.branch) {
				endpoint += "?ref=" + options.branch;
			}

			try {
				const response = await GitHub._makeRequest(endpoint, "GET");
				// The content is returned as base64 encoded, so we decode it before returning.
				response.contentDecoded = Utilities.newBlob(Utilities.base64Decode(response.content)).getDataAsString();
				return response;
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},

	},

	listDirectoryContents: {
		schema: function () {
			return {
				"name": "API.GitHub.listDirectoryContents",
				"description": "View the contents of a specified path in a branch (similar to 'ls' command)",
				"parameters": {
					"type": "object",
					"properties": {
						"branchName": {
							"type": "string",
							"description": "The branch name to list contents from",
						},
						"path": {
							"type": "string",
							"description": "The path to the directory to list contents from (use '.' for repo root directory)",
						}
					},
					"required": ["branchName", "path"]
				}
			};
		},
		execute: async function (options) {
			var pathQuery = options.path ? "?path=" + options.path : ".";
			try {
				var contents = await GitHub._makeRequest("/contents/" + pathQuery + "&ref=" + options.branchName, "GET");
				var results = [];
				for (var i = 0; i < contents.length; i++) {
					results.push(contents[i].name);
				}
				return results;
			} catch (error) {
				console.error("Execution failed:", error.message);
				throw error;
			}
		},
	},

}

export default GitHub

