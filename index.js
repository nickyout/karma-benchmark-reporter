var RelativeResultSaver = require('./lib/relative-result-saver');
var MockSaver = require('./lib/mock-saver');
var resultToRelativeResult = require('./lib/result-to-relative-result');
var path = require('path');

function toStringStyle(style) {
	if (style === "benchmark") {
		return function(bench) {
			// Partially from Benchmark#toString
			var hz = bench.hz;
			var stats = bench.stats;
			var size = stats.sample.length;
			return bench.name + ' x ' + Math.round(bench.hz) + ' ops/sec \xb1' + stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)\n';
		}
	} else {
		return function(benchmark) {
			return benchmark.name+' at '+Math.floor(benchmark.hz)+' ops/sec\n';
		}
	}
}

var BenchReporter = function(baseReporterDecorator, basePath, config, logger, formatError) {
  baseReporterDecorator(this);

  var resultSet = {};
  var options = config || {};
  var excludeFromFastest = options.exclude || [];
  var log = logger.create('reporter');
	var toStringBench = toStringStyle(options.logStyle || 'jsperf');

  var resolveName = options.resolveName || function(name, suiteName) { return name; };
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
          this.write('  '+fastest.benchmark.suite+': '+resolveName(fastest.benchmark.name, suiteName)+' at '+Math.floor(fastest.benchmark.hz)+' ops/sec ('+timesFaster+'x faster than '+resolveName(secondFastest.benchmark.name, suiteName)+')\n');
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
			.then(function(filePaths) {
				filePaths.forEach(function(filePath) {
					log.info("Written to " + filePath);
				});
			})
			.catch(function(err) {
				log.error('Writing files failed: ' + formatError(err));
			});
  };

  this.specSuccess = function(browser, result) {
    var browserName = browser.name;
    var suiteName = result.benchmark.suite;
		var benchClone = Object.assign({}, result.benchmark);

    // Get set and store results
    var browserSet = resultSet[browserName] = resultSet[browserName] || {};
    browserSet[suiteName] = browserSet[suiteName] || [];
    browserSet[suiteName].push(result);

		benchClone.name = resolveName(result.benchmark.name, suiteName);

		this.write(browserName+'  '+suiteName+': '+toStringBench(benchClone));
  };
};

BenchReporter.$inject = ['baseReporterDecorator', 'config.basePath', 'config.benchmarkReporter', 'logger', 'formatError'];

module.exports = {
  'reporter:benchmark': ['type', BenchReporter]
};
