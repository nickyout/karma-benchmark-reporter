var fs = require('fs-extra');
var objectPath = require('./object-path');

function flushFile(fileCache, filePath) {
	var promise = fileCache[filePath];
	// it should no longer be found on iteration
	delete fileCache[filePath];
	return promise
		.then(function(root) {
			return fs.writeFile(filePath, JSON.stringify(root, null, 4));
		})
		.catch(function(err) {
			throw new Error('Could not write object to file ' + filePath + ': ' +  err.message);
		});
}

/**
 * Intended as simple json save abstraction.
 * @param {Object} [baseObject] - every file that does not exist yet will get a clone of this object as its base.
 * @constructor
 */
function JSONFileCache(baseObject) {
	this._jsonFileCache = {};
	this._baseObject = baseObject || {};
}

/**
 * If not yet loaded into memory, reads the file under the filePath, creates one if it does not exist.
 * Proceeds to write the value of obj to the path defined by objectPathSegments.
 * Will keep the json into memory until flush() is called.
 * @param {string} filePath - the json file to write to
 * @param {Array<string>} objectPathSegments - the path segements inside the json file to write to
 * @param {*} obj - the value to write
 * @returns {Promise} resolves when done
 */
JSONFileCache.prototype.write = function(filePath, objectPathSegments, obj) {
	var baseObject = this._baseObject;
	var fileCache = this._jsonFileCache;
	var promise;

	if (fileCache.hasOwnProperty(filePath)) {
		promise = fileCache[filePath];
	} else {
		promise = fileCache[filePath] = fs.ensureFile(filePath)
			.then(function () {
				return fs.readFile(filePath, 'utf-8');
			})
			.then(function (str) {
				if (str) {
					return JSON.parse(str);
				} else {
					// clone
					return JSON.parse(JSON.stringify(baseObject));
				}
			})
			.catch(function (err) {
				throw new Error('Could not read object from ' + filePath + ': ' + err.message);
			});
	}

	fileCache[filePath] = promise
		.then(function(root) {
			// Set the object. Just overwrite if it exists: assume latest data is best.
			objectPath.setObject(root, objectPathSegments, obj);
			return root;
		});

	return fileCache[filePath];
};

/**
 * Saves all files to disk
 * @returns {Promise} resolves when done.
 */
JSONFileCache.prototype.flush = function() {
	var fileCache = this._jsonFileCache;
	var promises = Object.keys(this._jsonFileCache)
		.map(function(filePath) {
			return flushFile(fileCache, filePath);
		});
	return Promise.all(promises);
};



module.exports = JSONFileCache;
