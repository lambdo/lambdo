var test = require('tape')
var Lambdo = require('../')

test('basic stat collection', function(t) {
  var lambdo = new Lambdo
  lambdo.collect().then(function(stats) {

    console.log("STATS", JSON.stringify(stats, null, 2))

    lambdo.cleanup()
    t.notEqual(stats, undefined, 'should return stats')
    t.notEqual(stats.cpu, undefined, 'should return cpu data')
    t.notEqual(stats.mem, undefined, 'should return memory data')
    t.notEqual(stats.load, undefined, 'should return load data')
    t.end()
  })
})