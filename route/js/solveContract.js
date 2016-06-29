var exec = require('child_process').exec;
console.log("==EXEC== solveContract.js", process.argv[2].replace(/_/g, ' ') || "Hello, Gcoin");

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
  return "sudo docker exec -i "+role+" src/gcoin-cli "+cmd;
}

var cmdOracleAddress = DockerCmd("gcoin_oracle", "getfixedaddress");
var cmdClientAddress = DockerCmd("gcoin_client", "getfixedaddress");
var cmdOracleUnspent = DockerCmd("gcoin_oracle", "listunspent");

Promise.all([PromiseExec(cmdOracleAddress), PromiseExec(cmdClientAddress), PromiseExec(cmdOracleUnspent)]).then(function(promiseResult) {

  var oracleUnspentTx = JSON.parse(promiseResult[2]);

  var availableUnspentTx = oracleUnspentTx.filter(function(el) {
    if (el.amount == 3 && el.color == 1) {
      return true;
    }
  });

  if (availableUnspentTx.length > 0) {
    console.log("\n----------------------Unsolved Smart Contract of Oracle---------------------------\n");
    console.log(availableUnspentTx[0]);

    var OracleVin = [{
      txid: availableUnspentTx[0].txid,
      vout: availableUnspentTx[0].vout
    }];

    var ClientVout = [{
      address: promiseResult[1],
      value: 1,
      color: 1
    }, {
      address: promiseResult[1],
      value: 1,
      color: 1
    }];


    var cmdRawTransaction = DockerCmd("gcoin_oracle", "createrawtransaction '") + JSON.stringify(OracleVin) + "' '" + JSON.stringify(ClientVout)+ "'";

    PromiseExec(cmdRawTransaction).then(function(TxHex) {


            console.log("\n------------------------TxHex-----------------------------\n");
            console.log(TxHex);

            var front = TxHex.slice(0, TxHex.length-77);
            var tail = TxHex.slice(TxHex.length-25, TxHex.length);

            var rawData = process.argv[2].replace(/_/g, ' ') || "Hello, Gcoin";
            console.log("\n-----------------------rawData----------------------------\n");
            console.log(rawData);

            var base64Data = new Buffer(rawData).toString('base64');
            var chr_len_base64Data = String.fromCharCode(base64Data.length);
            var hexData = "6a" + new Buffer(chr_len_base64Data).toString('hex') + new Buffer(base64Data).toString('hex');
            var hexData = new Buffer(String.fromCharCode((new Buffer(hexData, 'hex').toString('ascii')).length)).toString('hex') + hexData;

            var newTx = front + hexData + tail;

            return newTx;

          }, ErrorHandler).then(function(newTx) {

            console.log("\n------------------------newTx-----------------------------\n");
            console.log(newTx);

            PromiseExec("sudo docker exec -i gcoin_oracle src/gcoin-cli signrawtransaction " + newTx).then(function(signedTx) {

              console.log("\n----------------------Signed Transaction Hex---------------------------\n");
              console.log(signedTx);

              var signedTx = JSON.parse(signedTx);
              var signedTxHex = signedTx.hex;

              PromiseExec("sudo docker exec -i gcoin_oracle src/gcoin-cli decoderawtransaction " + signedTxHex).then(function(rawTx) {

                console.log("\n----------------------Signed OP_RETURN---------------------------\n");
                console.log(rawTx);
              }, ErrorHandler);

              PromiseExec("sudo docker exec -i gcoin_oracle src/gcoin-cli sendrawtransaction " + signedTxHex).then(function(txId) {

                console.log("\n-------------------------Final txId------------------------------\n");
                console.log(txId);

              }, ErrorHandler);
            }, ErrorHandler);
          }, ErrorHandler);

  } else {
    console.log("There is no other contract!");
  }

});
