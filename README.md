# gcoin-SmartContract

## Usage:

1. npm install
2. node server.js

## RESTful API:

- Send a smart contract from gcoin-client to oracle-server  
http://localhost:10001/gcoinContract/sendContract/:ContractType

- Check all smart contract  
http://localhost:10001/gcoinContract/getContract/3?target=gcoin_oracle

- Solve a smart contract  
http://localhost:10001/gcoinContract/solveContract/:SolvedMessage

- Check all solved smart contract  
http://localhost:10001/gcoinContract/getContract/1?target=gcoin_client
