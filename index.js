os = require('os')
EventEmitter = require('events').EventEmitter

var Lambdo = function(options) {
  _this = this

  this.options = options || {}
  
  this.interval = setInterval(function() {
    _this.collect()
  }, this.options.interval || 10)
}

Lambdo.prototype.collect = function() {
  var stats = {
    load: os.loadavg(),
    mem: {
      free: os.freemem(),
      total: os.totalmem(),
    },
  }

  stats.used = stats.mem.total - stats.mem.used

  return stats
}

Lambdo.prototype.cleanup = function() {
  clearInterval(this.interval)
}

module.exports = Lambdo