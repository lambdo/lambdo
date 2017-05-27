var test = require('tape')
var Lambdo = require('../')

test('basic stat collection', function(t) {
  var lambdo = new Lambdo
  var stats = lambdo.collect()
  lambdo.cleanup()
  t.notEqual(stats, undefined, 'should return stats')
  t.notEqual(stats.cpu, undefined, 'should return cpu data')
  t.notEqual(stats.mem, undefined, 'should return memory data')
  t.notEqual(stats.load, undefined, 'should return load data')
  t.end()
})