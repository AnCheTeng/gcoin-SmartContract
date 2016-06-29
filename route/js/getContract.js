var exec = require('child_process').exec;

var msgCategory = process.argv[2] || 3;
var charactor = process.argv[3] || "gcoin_oracle";

// console.log("==EXEC== getContract.js" + " " + msgCategory + " " + charactor);

function PromiseExec(cmd) {
  return new Promise(function(resolve, reject) {
    exec(cmd, function(error, stdout, stderr) {
      if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

function ErrorHandler(err) {
  console.log(err);
}

function DockerCmd(role, cmd) {
  return "sudo docker exec -i "+ role +" src/gcoin-cli "+cmd;
}

function SmartContractRemainFilter(unspentList, coins) {
  return unspentList.filter(function(el) {
    if (el.amount == coins) {
      return true;
    }
  });
}


PromiseExec(DockerCmd(charactor, "listunspent")).then(function(unspentList) {

  var unspentList = JSON.parse(unspentList);
  var InfoList = SmartContractRemainFilter(unspentList, msgCategory);

  return InfoList.map(function(el){
    return el.txid;
  });

}).then(function(opList){

  return rawPromise = opList.map(function(el) {
    return PromiseExec(DockerCmd(charactor, "getrawtransaction ") + el).then(function(rawTx){
      return PromiseExec(DockerCmd(charactor, "decoderawtransaction ") + rawTx);
    });
  });

}).then(function(rawTxTxList){
  return Promise.all(rawTxTxList).then(function(decodedTxList){
    var decodedTxList = decodedTxList.filter(function(el) {
      el = JSON.parse(el);
      var voutLen = el.vout.length-1;
      	
      if (el.vout.length > 1 && el.vout[voutLen].scriptPubKey.asm.indexOf('OP_RETURN') > -1) {
        var scriptPubKeyData = el.vout[voutLen].scriptPubKey;
        return true;
      }
    });

    return msgList = decodedTxList.map(function(el) {
      el = JSON.parse(el);
      var voutLen = el.vout.length-1;
      var op_return_msg = el.vout[voutLen].scriptPubKey.asm;
      return op_return_msg.slice(10, op_return_msg.length + 1);
    });
  }, ErrorHandler);

}).then(function(msgList) {
  var finalMsgList = msgList.map(function(el) {
    var base64Data = new Buffer(el, 'hex').toString('ascii');
    var rawData = new Buffer(base64Data, 'base64').toString('ascii');
    return rawData;
  });

  console.log(finalMsgList || []);
});
