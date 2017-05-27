var os = require('os')
var pusage = require('pidusage')
var EventEmitter = require('events').EventEmitter

var Lambdo = function(options) {
  _this = this

  this.options = options || {}
  this.multiplier = this.options.multiplier || 1.5
  this.nextTimeout = this.options.startInterval || 1
}

Lambdo.prototype.cpuStats = function(callback) {
  if (false && process.cpuUsage) {
      callback(null, process.cpuUsage())
  } else {
    callback(null, os.cpus())
  }
}

Lambdo.prototype.record = function() {
  this.recording = []
  this.makeRecord()
}

Lambdo.prototype.makeRecord = function() {
  var item = {
    time: new Date().getTime(),
    stats: this.collect()
  }

  this.recording.push(item)

  this.nextTimeout *= this.multiplier
  this.timeout = setTimeout(this.makeRecord, this.nextTimeout)
}

Lambdo.prototype.collect = function(callback) {
  var _this = this
  var promise = new Promise(function(resolve, reject) {
    _this.cpuStats(function(err, usage) {
      var stats = {
        load: os.loadavg(),
        cpu: usage,
        mem: {
          free: os.freemem(),
          total: os.totalmem(),
          process: process.memoryUsage()
        },
      }

      if (callback) callback(err, stats)
      resolve(stats)
    })
  })

  return promise
}

Lambdo.prototype.cleanup = function() {
  clearTimeout(this.timeout)
}

Lambdo.prototype.handler = function(handler) {
  var _this = this

  return function(event, context, callback) {
    var start = new Date().getTime()
    _this.record()

    var finish = function(err, results) {
      end = new Date().getTime()
      duration = end - start
      console.log("TOTAL DURATION", duration)
      console.log("RECORDING", JSON.stringify(_this.recording, null, 2))
      _this.cleanup()
      callback(err, results)
    }

    context.done = finish

    context.succeed = function(results) {
      finish(null, results)
    }

    context.fail = function(err) {
      finish(err, null)
    }

    handler(event, context, finish)
  }
}

module.exports = Lambdo