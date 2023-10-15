import Unify from '../../globals.js';

const GitHub = {
  url: null,
  key: null,
  connect(credentials) {
    GitHub.url = credentials.url;
    GitHub.key = credentials.key;
    return GitHub;
  },
  isConnected() {
    return GitHub.url !== null && GitHub.key !== null;
  },
  async _makeRequest(endpoint, method, payload) {
    const headers = {
      Authorization: `Bearer ${GitHub.key}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    const options = {
      method,
      headers,
      muteHttpExceptions: true,
    };
    if (payload) {
      options.body = JSON.stringify(payload);
    }
    try {
      const response = await Unify.Request.fetch(GitHub.url + endpoint, options);
      return JSON.parse(await response.text());
    } catch (error) {
      Unify.Log.error('Error during request to', endpoint, ':', error.message);
      throw error;
    }
  },
  addFile: {
    schema() {
      return {
        name: 'GitHub_addFile',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            commitMessage: {
              type: 'string',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['path', 'content', 'commitMessage', 'branch'],
        },
      };
    },
    async execute(options) {
      try {
        const endpoint = `/contents/${options.path}`;
        const payload = {
          message: options.commitMessage,
          content: Unify.Utils.base64Encode(options.content),
          branch: options.branch,
        };
        // Awaiting the asynchronous _makeRequest method
        return await GitHub._makeRequest(endpoint, 'PUT', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error; // or handle error accordingly
      }
    },
  },
  getFileContent: {
    schema() {
      return {
        name: 'GitHub_getFileContent',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['path', 'branch'],
        },
      };
    },
    async execute(options) {
      let endpoint = `/contents/${options.path}`;
      if (options.branch) {
        endpoint += `?ref=${options.branch}`;
      }
      try {
        const response = await GitHub._makeRequest(endpoint, 'GET');
        // The content is returned as base64 encoded, so we decode it before returning.
        response.contentDecoded = Unify.Utils.base64DecodeToString(response.content);
        return response;
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  editFile: {
    schema() {
      return {
        name: 'GitHub_editFile',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            sha: {
              type: 'string',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['path', 'message', 'content', 'sha', 'branch'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/contents/${options.path}`;
      const payload = {
        message: options.message,
        content: Unify.Utils.base64Encode(options.content),
        sha: options.sha,
        branch: options.branch,
      };
      // Await here to resolve the Promise before returning from this function
      try {
        return await GitHub._makeRequest(endpoint, 'PUT', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error; // or handle it in some other way
      }
    },
  },
  replaceInFile: {
    schema() {
      return {
        name: 'GitHub_replaceInFile',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            replacement: {
              type: 'object',
              properties: {
                from: {
                  type: ['string', 'object'], // Allowing object to accommodate RegExp
                  properties: {
                    pattern: { type: 'string' }, // Pattern for RegExp
                    flags: { type: 'string' }, // Flags for RegExp
                  },
                },
                to: {
                  type: 'string',
                },
              },
              required: ['from', 'to'],
            },
            sha: {
              type: 'string',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['path', 'message', 'replacement', 'sha', 'branch'],
        },
      };
    },
    async execute(options) {
      try {
        // Step 1: Get the existing content of the file
        // Assume that getFileContent() fetches the current content of a file.
        const response = await GitHub.getFileContent.execute({ path: options.path, branch: options.branch });
        const fileContent = response.contentDecoded;
        // Step 2: Perform the replacement
        let newContent;

        // Check if from is a RegExp pattern or a string.
        if (typeof options.replacement.from === 'object' && options.replacement.from.pattern !== undefined) {
          const regExp = new RegExp(options.replacement.from.pattern, options.replacement.from.flags);
          newContent = fileContent.replace(regExp, options.replacement.to);
        } else {
          newContent = fileContent.replace(options.replacement.from, options.replacement.to);
        }

        // Step 3: Push the updated content back using the provided editFile API
        const editOptions = {
          path: options.path,
          message: options.message,
          content: newContent,
          sha: options.sha,
          branch: options.branch,
        };

        return await GitHub.editFile.execute(editOptions);
      } catch (error) {
        Unify.Log.error('replaceInFile failed:', error.message);
        throw error;
      }
    },
  },
  deleteFile: {
    schema() {
      return {
        name: 'GitHub_deleteFile',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
            commitMessage: {
              type: 'string',
            },
            sha: {
              type: 'string',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['path', 'commitMessage', 'sha', 'branch'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/contents/${options.path}`;
      const payload = {
        message: options.commitMessage,
        sha: options.sha,
        branch: options.branch,
      };
      try {
        return await GitHub._makeRequest(endpoint, 'DELETE', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error; // or handle error as suitable for your use case
      }
    },
  },
  createPullRequest: {
    schema() {
      return {
        name: 'GitHub_createPullRequest',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
            },
            headBranch: {
              type: 'string',
            },
            targetBranch: {
              type: 'string',
            },
            body: {
              type: 'string',
            },
          },
          required: ['title', 'headBranch', 'targetBranch', 'body'],
        },
      };
    },
    async execute(options) {
      const endpoint = '/pulls';
      const payload = {
        title: options.title,
        head: options.headBranch,
        base: options.targetBranch,
        body: options.body,
      };
      try {
        return await GitHub._makeRequest(endpoint, 'POST', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error; // or handle error accordingly
      }
    },
  },
  getIssue: {
    schema() {
      return {
        name: 'GitHub_getIssue',
        parameters: {
          type: 'object',
          properties: {
            issueNumber: {
              type: 'integer',
            },
          },
          required: ['issueNumber'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/issues/${options.issueNumber}`;
      try {
        return await GitHub._makeRequest(endpoint, 'GET');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error; // or handle error as suitable for your use case
      }
    },
  },
  closeIssue: {
    schema() {
      return {
        name: 'GitHub_closeIssue',
        parameters: {
          type: 'object',
          properties: {
            issueNumber: {
              type: 'integer',
            },
            branch: {
              type: 'string',
            },
          },
          required: ['issueNumber', 'branch'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/issues/${options.issueNumber}`;
      const payload = {
        state: 'closed',
        branch: options.branch,
      };
      try {
        return await GitHub._makeRequest(endpoint, 'PATCH', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  listBranches: {
    schema() {
      return {
        name: 'GitHub_listBranches',
        parameters: {},
      };
    },
    async execute() {
      const endpoint = '/branches';
      try {
        return await GitHub._makeRequest(endpoint, 'GET');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  listCommits: {
    schema() {
      return {
        name: 'GitHub_listCommits',
        parameters: {
          type: 'object',
          properties: {
            branch: {
              type: 'string',
            },
          },
          required: ['branch'],
        },
      };
    },
    async execute(options) {
      let endpoint = '/commits';
      if (options.branch) {
        endpoint += `?sha=${options.branch}`;
      }
      try {
        return await GitHub._makeRequest(endpoint, 'GET');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  getCommit: {
    schema() {
      return {
        name: 'GitHub_getCommit',
        parameters: {
          type: 'object',
          properties: {
            sha: {
              type: 'string',
            },
          },
          required: ['sha'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/commits/${options.sha}`;
      try {
        return await GitHub._makeRequest(endpoint, 'GET');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  createBranch: {
    schema() {
      return {
        name: 'GitHub_createBranch',
        parameters: {
          type: 'object',
          properties: {
            newBranchName: {
              type: 'string',
            },
            startPointSha: {
              type: 'string',
            },
          },
          required: ['newBranchName', 'startPointSha'],
        },
      };
    },
    async execute(options) {
      const endpoint = '/git/refs';
      const payload = {
        ref: `refs/heads/${options.newBranchName}`,
        sha: options.startPointSha,
      };
      try {
        return await GitHub._makeRequest(endpoint, 'POST', payload);
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  deleteBranch: {
    schema() {
      return {
        name: 'GitHub_deleteBranch',
        parameters: {
          type: 'object',
          properties: {
            branchName: {
              type: 'string',
            },
          },
          required: ['branchName'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/git/refs/heads/${options.branchName}`;
      try {
        return await GitHub._makeRequest(endpoint, 'DELETE');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  listTags: {
    schema() {
      return {
        name: 'GitHub_listTags',
        parameters: {},
      };
    },
    // eslint-disable-next-line no-unused-vars
    async execute(options) {
      const endpoint = '/tags';
      try {
        return await GitHub._makeRequest(endpoint, 'GET');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  createWebhook: {
    schema() {
      return {
        name: 'GitHub_createWebhook',
        parameters: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
            },
          },
          required: ['config'],
        },
      };
    },
    execute(options) {
      const endpoint = '/hooks';
      const payload = {
        name: 'web',
        config: options.config,
        events: ['push', 'pull_request'],
        active: true,
      };
      return GitHub._makeRequest(endpoint, 'POST', payload);
    },
  },
  deleteWebhook: {
    schema() {
      return {
        name: 'GitHub_deleteWebhook',
        parameters: {
          type: 'object',
          properties: {
            hookId: {
              type: 'integer',
            },
          },
          required: ['hookId'],
        },
      };
    },
    async execute(options) {
      const endpoint = `/hooks/${options.hookId}`;
      try {
        return await GitHub._makeRequest(endpoint, 'DELETE');
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  listDirectoryContents: {
    schema() {
      return {
        name: 'GitHub_listDirectoryContents',
        parameters: {
          type: 'object',
          properties: {
            branchName: {
              type: 'string',
            },
            path: {
              type: 'string',
            },
          },
          required: ['branchName', 'path'],
        },
      };
    },
    async execute(options) {
      const pathQuery = options.path ? `?path=${options.path}` : '.';
      try {
        const contents = await GitHub._makeRequest(`/contents/${pathQuery}&ref=${options.branchName}`, 'GET');
        const results = [];
        for (let i = 0; i < contents.length; i += 1) {
          results.push(contents[i].name);
        }
        return results;
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
  listLatestCommitSHA: {
    schema() {
      return {
        name: 'GitHub_listLatestCommitSHA',
        parameters: {
          type: 'object',
          properties: {
            branchName: {
              type: 'string',
            },
          },
          required: ['branchName'],
        },
      };
    },
    async execute(options) {
      const { branchName } = options;
      if (!branchName) {
        throw new Error('Branch name is required.');
      }
      const endpoint = `/git/ref/heads/${branchName}`;
      try {
        const response = await GitHub._makeRequest(endpoint, 'GET');
        return response.object.sha;
      } catch (error) {
        Unify.Log.error('Execution failed:', error.message);
        throw error;
      }
    },
  },
};
export default GitHub;
