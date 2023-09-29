GitHub = {
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

	_makeRequest: function (endpoint, method, payload) {
		var headers = {
			"Authorization": "Bearer " + this.key,
			"Accept": "application/vnd.github+json",
			"Content-Type": "application/json"
		};

		var options = {
			"method": method,
			"headers": headers,
			"muteHttpExceptions": true
		};

		if (payload) {
			options.payload = JSON.stringify(payload);
		}

		var response = UrlFetchApp.fetch(this.url + endpoint, options);
		return JSON.parse(response.getContentText());
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
		execute: function (options) {
			var endpoint = "/contents/" + options.path;
			var payload = {
				"message": options.commitMessage,
				"content": Utilities.base64Encode(options.content),
				"branch": options.branch
			};
			return this._makeRequest(endpoint, "PUT", payload);
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
		execute: function (options) {
			var endpoint = "/contents/" + options.path;
			var payload = {
				"message": options.message,
				"content": Utilities.base64Encode(options.content),
				"sha": options.sha,
				"branch": options.branch
			};
			return this._makeRequest(endpoint, "PUT", payload);
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
		execute: function (options) {
			var endpoint = "/contents/" + options.path;
			var payload = {
				"message": options.commitMessage,
				"sha": options.sha,
				"branch": options.branch
			};
			return this._makeRequest(endpoint, "DELETE", payload);
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
		execute: function (options) {
			var endpoint = "/pulls";
			var payload = {
				"title": options.title,
				"head": options.headBranch,
				"base": options.targetBranch,
				"body": options.body
			};
			return this._makeRequest(endpoint, "POST", payload);
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
		execute: function (options) {
			var endpoint = "/issues/" + options.issueNumber;
			return this._makeRequest(endpoint, "GET");
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
		execute: function (options) {
			var endpoint = "/issues/" + options.issueNumber;
			var payload = {
				"state": "closed",
				"branch": options.branch
			};
			return this._makeRequest(endpoint, "PATCH", payload);
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
		execute: function () {
			var endpoint = "/branches";
			return this._makeRequest(endpoint, "GET");
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
		execute: function (options) {
			var endpoint = "/commits";
			if (options.branch) {
				endpoint += "?sha=" + options.branch;
			}
			return this._makeRequest(endpoint, "GET");
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
		execute: function (options) {
			var endpoint = "/commits/" + options.sha;
			return this._makeRequest(endpoint, "GET");
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
		execute: function (options) {
			var endpoint = "/git/refs";
			var payload = {
				"ref": "refs/heads/" + options.newBranchName,
				"sha": options.startPointSha
			};
			return this._makeRequest(endpoint, "POST", payload);
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
		execute: function (options) {
			var endpoint = "/git/refs/heads/" + options.branchName;
			return this._makeRequest(endpoint, "DELETE");
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
		execute: function (options) {
			var endpoint = "/tags";
			return this._makeRequest(endpoint, "GET");
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
			return this._makeRequest(endpoint, "POST", payload);
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
		execute: function (options) {
			var endpoint = "/hooks/" + options.hookId;
			return this._makeRequest(endpoint, "DELETE");
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
		execute: function (options) {
			var endpoint = "/contents/" + options.path;

			if (options.branch) {
				endpoint += "?ref=" + options.branch;
			}

			var response = this._makeRequest(endpoint, "GET");
			// The content is returned as base64 encoded, so we decode it before returning.
			response.contentDecoded = Utilities.newBlob(Utilities.base64Decode(response.content)).getDataAsString();
			return response;
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
		execute: function (options) {
			var pathQuery = options.path ? "?path=" + options.path : ".";
			var contents = this._makeRequest("/contents/" + pathQuery + "&ref=" + options.branchName, "GET");
			var results = [];
			for (var i = 0; i < contents.length; i++) {
				results.push(contents[i].name);
			}
			return results;
		},
	},

}

