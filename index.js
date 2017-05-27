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
  var stats = {
    load: os.loadavg(),
    cpu: os.cpus(),
    mem: {
      free: os.freemem(),
      total: os.totalmem(),
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