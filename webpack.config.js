const path = require('path');
const fs = require('fs');
const webpack = require('webpack'); // Import webpack
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const CopyPlugin = require('copy-webpack-plugin');

// Dynamically set up entry points
const entryPoints = {};
fs.readdirSync('./src').forEach(file => {
	if (file.match(/\.js$/)) {
		const filename = file.replace('.js', '');
		entryPoints[filename] = `./src/${file}`;
	}
});

class RemoveLinesPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap('RemoveLinesPlugin', (compilation) => {
			compilation.hooks.processAssets.tapAsync(
				{
					name: 'RemoveLinesPlugin',
					stage: compilation.PROCESS_ASSETS_STAGE_PROCESS,
				},
				(assets, callback) => {
					Object.keys(assets).forEach((key) => {
						if (key.match(/\.js$/)) {
							let source = assets[key].source();

							if(!(typeof source === 'string' || source instanceof String)){
								return; // Skip to the next iteration
							}

							// Replacement rules array
							const replacementRules = [
								{ regex: /\/\*{3,}\/.*?\n/g, replacement: '' },
								{ regex: /__webpack_require__\.r\(__webpack_exports__\);\n/g, replacement: '' },
								{ regex: /__webpack_require__\.d\(__webpack_exports__, \{[\s\S]*?\}\);\n/g, replacement: '' },
								{ regex: /\/\* harmony.*?\*\/.*?\n/g, replacement: '' },
								{ regex: /;\/\/ CONCATENATED MODULE:(.*?)\n/g, replacement: (match, group1) => `// Concatenated module: ${group1}\n` },
								{ regex: /\/\/[A-Z\s]+?\n/g, replacement: '' },
								{ regex: /\;\n/g, replacement: '\n' },
								{ regex: /\n{2,}/g, replacement: '\n' },
							];

							// Apply replacement rules
							replacementRules.forEach(rule => {
								source = source.replace(rule.regex, rule.replacement).trim();
							});

							compilation.updateAsset(
								key,
								new webpack.sources.RawSource(source),
								assets[key].info
							);
						}
					});
					callback();
				}
			);
		});
	}
}


module.exports = {
	entry: entryPoints,
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist/gas'),
	},
	resolve: {
		alias: {
			'@unify': path.resolve(__dirname, 'src/unify/'),
		}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'buble-loader',
					options: {
						transforms: {
							modules: false,
						}
					}
				}
			}
		]
	},
	optimization: {
		minimize: false,
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: './src/appsscript.json', to: './' },
				{ from: './src/_vendor/lodash.js', to: './' },
			],
		}),
		new RemoveLinesPlugin(),
		new Serve()
	],
};
