var express = require('express');
var bodyParser = require('body-parser');
var CronJob = require('cron').CronJob;

var exec = require('child_process').exec;

var router = express.Router();

var parseUrlencoded = bodyParser.urlencoded({
  extended: false
});

// ============= API =============
var cmdPrefix = "sudo docker exec -i ";
var cmdSrcPath = " src/gcoin-cli ";
var cmdMint = "mint";

function DockerCmd(role) {
  var cmd = cmdPrefix + role + cmdSrcPath;
  for (var i = 1; i < arguments.length; i++)
    cmd += (arguments[i] + ' ');
  console.log(' [Server] ' + cmd);
  return cmd;
}

// mining
// usage: /gcoinContract/mint/10/1
router.route('/mint/:amount/:type')
	.get(parseUrlencoded, function(req, res) {
    var role = req.query.role || 'gcoin_client', type = req.params.type, amount = req.params.amount;
    var cmd = DockerCmd(role, cmdMint, amount, type);
    exec(cmd, function(error, stdout, stderr){
      var str = role + " mint type " + type + " (amount: " + amount + ")\n";
      str += (stdout || []);
      res.send(str);
    });
	});

// Send contract to gcoin blockchain
router.route('/sendContract/:contractType')
  .get(parseUrlencoded, function(request, response) {
    console.log(' [Server] node route/js/sendContract.js ' + request.params.contractType)
    exec('node route/js/sendContract.js ' + request.params.contractType.replace(/ /g, '_'), function(error, stdout, stderr){
      response.send(stdout || "<h3>Contract Failed:</h3>" + request.params.contractType);
    });
  });


// Resolve contract back to gcoin blockchain
router.route('/solveContract/:solveMessage')
  .get(parseUrlencoded, function(request, response) {
    console.log(' [Server] node route/js/solveContract.js ' + request.params.solveMessage)
    exec('node route/js/solveContract.js ' + request.params.solveMessage.replace(/ /g, '_'), function(error, stdout, stderr){
      response.send(stdout || "<h3>Solving Failed:</h3>" + request.params.solveMessage);
    });
  });



// msgType dafault = 3
router.route('/getContract/:msgType')
	.get(parseUrlencoded, function(request, response) {
    var target = request.query.target || "";
    console.log(' [Server] node route/js/getContract.js ' + request.params.msgType + " " + target);
    exec('node route/js/getContract.js ' + request.params.msgType + " " + target, function(error, stdout, stderr){
      response.send(stdout || []);
    });
	});


new CronJob('* * * * * *', function() {
  // Periodic check the state here
  console.log("Hi, this is CronJob!");

}, null, true, 'America/Los_Angeles');


module.exports = router;
