# karma-benchmark-reporter
> A jsPerf-style reporter for karma-benchmark

With option to store the test results, and exclude benchmarks from the comparison.

## Installation

```shell
npm install karma-benchmark-reporter --save-dev
```

## Configuration
Minimal:

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    reporters: ['benchmark']
  });
};
```

Full:

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    reporters: ['benchmark'],
    benchmarkReporter: {
      destDir: 'relative/to/basePath',
      exclude: ['benchmark-name'],
      resolveName: function(benchmarkName) {
        return benchmarkName + '@latest';
      }
    }
  });
};
```

### Options:

#### benchmarkReporter.destDir
_type: string_
_optional_

If defined, the test results will be stored under the directory, relative to `basePath`.
Results are stored in json files per browser + os - `[destDir]/[benchmarkSuiteName]/[browser+os].json`
in which the format follows:

```
{
  "[benchmarkName]": {
    "name": "[benchmarkName]",
    "browser": "[browser+os]",
    "suite": "[benchmarkSuiteName]",
    "hz": 4793.602660245505,
    "success": true,
    "fastest": false,
    "rme": 0.01518934890320584,
    "rhz": 0.7219872859181244
  },
  ...
}
```

Every new test run will overwrite the previous file.

#### benchmarkReporter.exclude
_type: boolean_
_optional_

Exclude particular benchmarks from the 'fastest' comparison. Use if you want to see the relative
performance, but not consider the result as part of the the comparison you want to make.
Uses the original benchmark name, not the one yielded by resolveName.

#### benchmarkReporter.resolveName
_type: function(string): string_
_optional_

Format the benchmark names before they are displayed or stored. For instance, if you automatically want
the benchmark to be suffixed by the version number, you could do it with this.

## Possible questions

### Why relative test result format?

The benchmark is supposed to find the fastest way to execute a particular action, and preferably see how much
faster it is compared to its competitors. Running a benchmark test can give a result for a particular browser
(on a particular os), which is typically expressed in number of operations per second. But the number of
operations per second is also affected to a significant degree by the machine itself. Therefore, this number,
although it gives a good indication, only has meaning compared to the fastest competitor of the same
benchmark suite, and only within the benchmark suite run on a particular machine. However, the relative results
are (probably) the same across all machines.

I have had a lot of instability problems in running remote browser tests in the past. In order to prevent
having to completely start over again after every unforeseen error, I decided to write away the test results
that did complete, so eventually the problem would get isolated to a specific browser, or the entire data set
would eventually be available. In order to extract any meaning from these benchmark results, they would have to be
interpreted in relation to the other benchmarks on the same machine.

Therefore, each benchmark suite overwrites the previous one, and its contents are all relative. 