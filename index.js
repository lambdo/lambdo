var os = require('os')
var AWS = require('aws-sdk')
var EventEmitter = require('events').EventEmitter

MAX_TIMEOUT = 30 * 60 * 1000

var Lambdo = function(options) {
  _this = this

  this.options = options || {}
  this.multiplier = this.options.multiplier || 1.5
  this.nextTimeout = this.options.startInterval || 1
}

Lambdo.prototype.record = function() {
  _this = this
  this.recording = []
  this.timeout = setTimeout(function() {_this.makeRecord()}, this.nextTimeout)
  this.makeRecord()
}

Lambdo.prototype.makeRecord = function() {
  var item = this.collect()
  item.time = new Date().getTime()
  this.recording.push(item)
}

Lambdo.prototype.onTimeout = function() {
  _this = this
  this.makeRecord()
  this.nextTimeout *= this.multiplier
  
  if (this.nextTimeout > MAX_TIMEOUT) {
    this.nextTimeout = MAX_TIMEOUT
  }

  this.timeout = setTimeout(function() {_this.makeRecord()}, this.nextTimeout)
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

  var cpuStats = {}
  for (var iCPU=0; iCPU<cpuData.length; ++iCPU) {
    for (var key in cpuData[iCPU].usage) {
      if (cpuStats[key] === undefined) {
        cpuStats[key] = 0
      }

      cpuStats[key] += cpuData[iCPU].usage[key]
    }
  }

  for (var key in cpuData[0].usage) {
    cpuStats[key] = Math.round(cpuStats[key] / cpuData.length)
  }


  var processMem = process.memoryUsage()

  var stats = {
    cpu: cpuStats,
    mem: {
      free: os.freemem(),
      total: os.totalmem(),
      processRSS: processMem.rss,
      provisioned: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 512,
      processHeapUsed: processMem.heapUsed,
      processHeapTotal: processMem.heapTotal,
    },
  }

  stats.mem.used = stats.mem.total - stats.mem.free

  return stats
}

Lambdo.prototype.cleanup = function() {
  clearTimeout(this.timeout)
}

Lambdo.prototype.getIdentity = function(callback) {
  var STS = new AWS.STS({
    region: process.env.AWS_REGION || 'us-east-1'
  })

  STS.getCallerIdentity({}, function(err, results) {
    callback(err, results)
  })
}

Lambdo.prototype.handler = function(handler) {
  var _this = this
  var identity = undefined
  var identityCallback = undefined

  return function(event, context, callback) {
    _this.getIdentity(function(err, results) {
      identity = results

      if (context.aws && context.aws.services) {
        identity.functionName = context.aws.functionName
      } else {
        identity.functionName = process.env.AWS_LAMBDA_FUNCTION_NAME
      }

      if (identityCallback != undefined) {
        identityCallback()
      }
    })

    _this.record()
    var start = new Date().getTime()

    var waitForIdentity = function(callback) {
      if (identity === undefined) {
        identityCallback = callback
      } else {
        callback()
      }
    }

    var endpoint = undefined
    if (context.aws && context.aws.services) {
      endpoint = context.aws.services['AWS:Lambda'].endpoint
    }

    var lambda = new AWS.Lambda({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: endpoint
    })

    var sendStats = function(stats, callback) {
      var params = {
        FunctionName: '133713371337:lambdo-report-development',
        InvocationType: 'Event',
        Payload: new Buffer(JSON.stringify(stats))
      }

      lambda.invoke(params, function(err, results) {
        callback()
      })
    }

    var finish = function(err, results) {
      _this.makeRecord()
      _this.cleanup()

      end = new Date().getTime()
      duration = end - start

      waitForIdentity(function() {
        var perf = {
          end: end,
          start: start,
          duration: duration,
          identity: identity,
          recording: _this.recording,
        }

        sendStats(perf, function() {
          callback(err, results)
        })
      })
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

Lambdo.monitor = function(options, handler) {
  if (handler === undefined) {
    handler = options
    options = {}
  }

  var lambdo = new Lambdo(options)
  return lambdo.handler(handler)
}

module.exports = Lambdo