// Modified code from https://github.com/saucelabs/node-tutorials/blob/master/mocha-wd-parallel/parallel-mochas.js
var exec = require('child_process').exec;
var Q = require('q');
var _ = require('lodash');

var mochaArgs = process.argv[2];

// building device list
var devices = process.argv.splice(3);

// context specific log
function log(config, data) {
  config = (config + '          ').slice(0, 10);
  _(('' + data).split(/(\r?\n)/g)).each(function(line) {        
    if(line.replace(/\033\[[0-9;]*m/g,'').trim().length >0) { 
      console.log(config + ': ' + line.trimRight() );
    }
  });
}

// runs the mocha tests for a given device
function run_mocha(device, done) {
  var env = _(process.env).clone();
  env.DEVICE = device;

  var mocha = exec('mocha ' + mochaArgs, {env: env}, done);
//  var mocha = exec('mocha ' + mochaArgs + '>/tmp/stout 2>/tmp/stderr; echo $SAUCE > /tmp/sauce', {env: env}, done);
  mocha.stdout.on('data', log.bind(null, device));
  mocha.stderr.on('data', log.bind(null, device));
}

// building job list
var jobs = _(devices).map(function(device) {
  return Q.nfcall(run_mocha, device, function(error, stdout, stderr) {
    console.log(stdout);
    if (error !== null) {
      console.log('Device ' + device + ' Failed.  Please log into Sauce Labs to see details');
      throw(error);
    }
  });
}).value();

// running jobs in parallel
Q.all(jobs).then(function() {
  console.log("ALL TESTS SUCCESSFUL");
})
.done();