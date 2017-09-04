/**
 * @typedef {Object} Result
 * @prop {number} id
 * @prop {string} description
 * @prop {Array} suite
 * @prop {boolean} success
 * @prop {Array} log
 * @prop {boolean} skipped
 * @prop {number} time
 * @prop {ResultBenchmark} benchmark
 */

/**
 * @typedef {Object} ResultBenchmark
 * @prop {string} suite
 * @prop {string} name
 * @prop {number} count
 * @prop {number} cycles
 * @prop {number} hz
 * @prop {Object} stats
 * @prop {number} stats.moe - margin of error
 * @prop {number} stats.rme - relative margin of error (in %)
 * @prop {number} stats.sem - standard error margin
 * @prop {number} stats.deviation
 * @prop {number} stats.mean
 * @prop {Array<number>} stats.sample
 */

/**
 * Since every machine has its own speed, absolute test results have no absolute value.
 * However, (I suspect that) the one that is the fastest will relatively be faster than the others.
 * @typedef {Object} RelativeResult
 * @prop {string} name
 * @prop {boolean} success
 * @prop {number} hz
 * @prop {boolean} fastest - is fastest or, statistic significantly speaking, no slower than the fastest
 * @prop {number} rme - relative margin of error (expressed as decimal, NOT %)
 * @prop {number} rhz - relative hz compared to the fastest (expressed as decimal, NOT %)
 */

var Benchmark = require('benchmark');
module.exports = {
	/**
   *
   * @param {Result} result
   * @param {Result} resultFastest
   * @returns {RelativeResult}
   */
  relative: function(result, resultFastest) {
        var bench = result.benchmark;
        var benchFastest = resultFastest.benchmark;
        return {
            name: bench.name,
            success: result.success,
            hz: bench.hz,
            fastest: Benchmark.prototype.compare.call(benchFastest, bench) === 0,
            rme: bench.stats.rme / 100,
            rhz: bench.hz / benchFastest.hz
        };
    }
};
