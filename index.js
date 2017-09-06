var RelativeResultSaver = require('./lib/relative-result-saver');
var MockSaver = require('./lib/mock-saver');
var resultToRelativeResult = require('./lib/result-to-relative-result');
var path = require('path');

var BenchReporter = function(baseReporterDecorator, basePath, config, logger, formatError) {
  baseReporterDecorator(this);

  var resultSet = {};
  var options = config || {};
  var excludeFromFastest = options.exclude || [];
  var log = logger.create('reporter');

  var resolveName = options.resolveName || function(name) { return name; };
	var destDir = options.destDir && path.resolve(basePath, options.destDir);
	var saver = destDir ? new RelativeResultSaver(destDir, resolveName) : new MockSaver();

	this.onRunComplete = function(browsers, resultInfo) {
    for (var browserName in resultSet) {
      var suites = resultSet[browserName];

      this.write(browserName+'\n');

      for (var suiteName in suites) {
        var results = suites[suiteName];
        var resultsCandidate = results.filter(function(result) {
          return excludeFromFastest.indexOf(result.benchmark.name) === -1;
        });
        if (resultsCandidate.length > 1) {
          // Find the fastest among the groups
          resultsCandidate.sort(function(a, b) {
            return b.benchmark.hz - a.benchmark.hz;
          });

          var fastest = resultsCandidate[0];
          var secondFastest = resultsCandidate[1];

          // classic result
          var timesFaster = (fastest.benchmark.hz/secondFastest.benchmark.hz).toFixed(2);
          this.write('  '+fastest.benchmark.suite+': '+resolveName(fastest.benchmark.name)+' at '+Math.floor(fastest.benchmark.hz)+' ops/sec ('+timesFaster+'x faster than '+resolveName(secondFastest.benchmark.name)+')\n');
        }
        else {
          this.write('  '+results[0].description+' had no peers for comparison at '+Math.floor(results[0].benchmark.hz)+' ops/sec\n')
        }

				results
					.map(function(result) {
						return resultToRelativeResult(result, fastest);
					})
					.forEach(function(relativeResult) {
						saver.save(suiteName, browserName, relativeResult);
					});
      }
    }
		// Save all results to disk
		saver.flush(results)
			.then(function(output) {
				if (output.length) {
					log.info(output.length + " files written to disk\n");
				}
			})
			.catch(function(err) {
				log.error('Writing files failed: ' + formatError(err));
			});
  };

  this.specSuccess = function(browser, result) {
    var browserName = browser.name;
    var suiteName = result.benchmark.suite;
    var benchName = resolveName(result.benchmark.name);

    // Get set and store results
    var browserSet = resultSet[browserName] = resultSet[browserName] || {};
    browserSet[suiteName] = browserSet[suiteName] || [];
    browserSet[suiteName].push(result);

    this.write(browserName+'  '+suiteName+': '+benchName+' at '+Math.floor(result.benchmark.hz)+' ops/sec\n');
  };
};

BenchReporter.$inject = ['baseReporterDecorator', 'config.basePath', 'config.benchmarkReporter', 'logger', 'formatError'];

module.exports = {
  'reporter:benchmark': ['type', BenchReporter]
};
