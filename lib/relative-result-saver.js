var path = require('path');
var JSONFileCache = require('./json-file-cache');
var sanitizeFilename = require('sanitize-filename');

/**
 *
 * @param {string} destDir
 * @param {function(string): string} [resolveLibName]
 */
function RelativeResultSaver(destDir, resolveLibName) {
	this._destDir = destDir;
	this._resolveLibName = resolveLibName || function(name) {
			return name;
		};
	this._jsonFileCache = new JSONFileCache();
}

/**
 * @param {string} suiteName
 * @param {string} browserName
 * @param {RelativeResult} relativeResult
 */
RelativeResultSaver.prototype.save = function(suiteName, browserName, relativeResult) {
	var destDir = this._destDir;
	var libFullName = this._resolveLibName(relativeResult.name);
	var filePath = path.resolve(destDir, suiteName, sanitizeFilename(browserName + '.json'));
	return this._jsonFileCache.write(filePath, [libFullName], {
		name: libFullName,
		browser: browserName,
		suite: suiteName,
		hz: relativeResult.hz,
		success: relativeResult.success,
		fastest: relativeResult.fastest,
		rme: relativeResult.rme,
		rhz: relativeResult.rhz
	});
};

RelativeResultSaver.prototype.flush = function() {
	return this._jsonFileCache.flush();
};

module.exports = RelativeResultSaver;

