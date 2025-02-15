/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/// <reference path="../../../../typings/require.d.ts" />

//@ts-check
(function () {
	'use strict';

	/**
	 * @typedef {import('../../environment/common/argv').NativeParsedArgs} NativeParsedArgs
	 * 
	 * @param {typeof import('path')} path
	 * @param {typeof import('os')} os
	 * @param {string} productName
	 */
	function factory(path, os, productName) {

		/**
		 * @param {NativeParsedArgs} cliArgs
		 *
		 * @returns {string}
		 */
		function getUserDataPath(cliArgs) {
			return path.resolve(doGetUserDataPath(cliArgs));
		}

		/**
		 * @param {NativeParsedArgs} cliArgs
		 *
		 * @returns {string}
		 */
		function doGetUserDataPath(cliArgs) {

			// 1. Support portable mode
			const portablePath = process.env['VSCODE_PORTABLE'];
			if (portablePath) {
				return path.join(portablePath, 'user-data');
			}

			// 2. Support explicit --user-data-dir
			const cliPath = cliArgs['user-data-dir'];
			if (cliPath) {
				return cliPath;
			}

			// 3. Support global VSCODE_APPDATA environment variable
			let appDataPath = process.env['VSCODE_APPDATA'];

			// 4. Otherwise check per platform
			if (!appDataPath) {
				switch (process.platform) {
					case 'win32':
						appDataPath = process.env['APPDATA'];
						if (!appDataPath) {
							const userProfile = process.env['USERPROFILE'];
							if (typeof userProfile !== 'string') {
								throw new Error('Windows: Unexpected undefined %USERPROFILE% environment variable');
							}

							appDataPath = path.join(userProfile, 'AppData', 'Roaming');
						}
						break;
					case 'darwin':
						appDataPath = path.join(os.homedir(), 'Library', 'Application Support');
						break;
					case 'linux':
						appDataPath = process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
						break;
					default:
						throw new Error('Platform not supported');
				}
			}

			return path.join(appDataPath, productName);
		}

		return {
			getUserDataPath
		};
	}

	if (typeof define === 'function') {
		define(['require', 'path', 'os', 'vs/base/common/network', 'vs/base/common/resources'], function (require, /** @type {typeof import('path')} */ path, /** @type {typeof import('os')} */ os, /** @type {typeof import('../../../base/common/network')} */ network, /** @type {typeof import("../../../base/common/resources")} */ resources) {
			const rootPath = resources.dirname(network.FileAccess.asFileUri('', require));
			const pkg = require.__$__nodeRequire(resources.joinPath(rootPath, 'package.json').fsPath);

			return factory(path, os, pkg.name);
		}); // amd
	} else if (typeof module === 'object' && typeof module.exports === 'object') {
		const pkg = require('../../../../../package.json');
		const path = require('path');
		const os = require('os');

		module.exports = factory(path, os, pkg.name); // commonjs
	} else {
		throw new Error('Unknown context');
	}
}());
