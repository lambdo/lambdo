Lambdo = require('../')

lambdo = new Lambdo()

NUM_RUNS = 1000000

var stats = {}

var start = new Date().getTime()

for (var iStat=0; iStat<NUM_RUNS; ++iStat) {
  stats = lambdo.collect()
}

var end = new Date().getTime()
var duration = (end - start) / NUM_RUNS

console.log("AVG Duration: " + duration + "ms")