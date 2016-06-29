// npm install
var express = require('express');
var oracleRoute = require('./route/smartcontract');

var app = express();

console.log("===========================Server is starting===========================");

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use('/gcoinContract', oracleRoute);

app.listen('10001', function(request, response) {
  console.log('listening to 10001 port');
});
