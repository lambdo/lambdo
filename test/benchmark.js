var async = require('async')
var Lambdo = require('../')

var lambdo = new Lambdo()
var NUM_RUNS = 100000

var stats = {}

var start = new Date().getTime()

promises = []
for (var iStat=0; iStat<NUM_RUNS; ++iStat) {
  promises.push(lambdo.collect())
}

Promise.all(promises).then(function() {
  var end = new Date().getTime()
  var duration = (end - start) / NUM_RUNS

  console.log("AVG Duration: " + duration + "ms")
}).catch(function(err) {
  console.log("CAUGHT ERR", err)
})