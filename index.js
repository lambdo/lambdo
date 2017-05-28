os = require('os')
EventEmitter = require('events').EventEmitter

var Lambdo = function(options) {
  _this = this

  this.options = options || {}
  this.multiplier = this.options.multiplier || 1.5
  this.nextTimeout = this.options.startInterval || 1
}

Lambdo.prototype.record = function() {
  this.recording = []
  this.timeout = setTimeout(this.onTimeout, this.nextTimeout)
  this.makeRecord()
}

Lambdo.prototype.makeRecord = function() {
  var item = {
    time: new Date().getTime(),
    stats: this.collect()
  }

  this.recording.push(item)
}

Lambdo.prototype.onTimeout = function() {
  this.makeRecord()
  this.nextTimeout *= this.multiplier
  this.timeout = setTimeout(this.onTimeout, this.nextTimeout)
}

Lambdo.prototype.collect = function() {
  var cpus = os.cpus()
  var cpuData = []
  for (var iCPU=0; iCPU<cpus.length; ++iCPU) {
    var cpu = cpus[iCPU]
    var data = {
      total: 0,
      usage: {},
      index: iCPU,
    }

    for(var type in cpu.times) {
        data.total += cpu.times[type]
    }

    for(type in cpu.times) {
      data.usage[type] = Math.round(100 * cpu.times[type] / data.total)
    }

    cpuData.push(data)
  }

  var stats = {
    load: os.loadavg(),
    cpu: cpuData,
    mem: {
      free: os.freemem(),
      total: os.totalmem(),
      process: process.memoryUsage(),
    },
  }

  stats.used = stats.mem.total - stats.mem.used

  return stats
}

Lambdo.prototype.cleanup = function() {
  clearTimeout(this.timeout)
}

Lambdo.prototype.handler = function(handler) {
  var start = new Date().getTime()
  return function(event, context, callback) {

    var finish = function(err, results) {
      end = new Date().getTime()
      duration = end - start
      console.log("TOTAL DURATION", duration)
      console.log("RECORDING", this.recording)
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