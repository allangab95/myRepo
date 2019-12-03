'use strict';
const shim = require('fabric-shim');
const util = require('util');
let Chaincode = class {
// The Init method is called when the Smart Contract 'house' is instantiated by the blockchain network
// Best practice is to have any Ledger initialization in separate function -- see initLedger()
async Init(stub) {
console.info('=========== Instantiated house title chaincode ===========');
return shim.success();
}
// The Invoke method is called as a result of an application request to run the Smart Contract
// 'house'. The calling application program has also specified the particular smart contract
// function to be called, with arguments
async Invoke(stub) {
let ret = stub.getFunctionAndParameters();
console.info(ret);
let method = this[ret.fcn];
if (!method) {
console.error('no function of name:' + ret.fcn + ' found');
throw new Error('Received unknown function ' + ret.fcn + ' invocation');
}
try {
let payload = await method(stub, ret.params);
return shim.success(payload);
} catch (err) {
console.log(err);
return shim.error(err);
}
}
async queryHouse(stub, args) {
if (args.length != 1) {
throw new Error('Incorrect number of arguments. Expecting houseNumber ex: HOUSE01');
}
let houseNumber = args[0];
let houseAsBytes = await stub.getState(houseNumber); //get the house from chaincode state
if (!houseAsBytes || houseAsBytes.toString().length <= 0) {
throw new Error(houseNumber + ' does not exist: ');
}
console.log(houseAsBytes.toString());
return houseAsBytes;
}
async initLedger(stub, args) {
console.info('============= START : Initialize Ledger ===========');
let houses = [];
houses.push({
address: '123 Arlington Blvd, Arlington, VA 22201',
parcel: '29328',
seller: 'John Doe',
buyer: 'Mark Smith',
date: 'November 1, 2018',
legalDesc: 'City main street intersection NW, block 28933',
contract: ' '
});
houses.push({
address: '789 Sunshine Blvd, Washington, DC 20008',
parcel: '728383',
seller: 'Mary Jones',
buyer: 'Bobbie Hendersen',
date: 'Octorber 25, 2018',
legalDesc: 'River end, tide rising SE, block 76232',
contract: ' '
});
for (let i = 0; i < houses.length; i++) {
houses[i].docType = 'house';
await stub.putState('HOUSE' + i, Buffer.from(JSON.stringify(houses[i])));
console.info('Added <--> ', houses[i]);
}
console.info('============= END : Initialize Ledger ===========');
}
async addHouse(stub, args) {
console.info('============= START : Add House ===========');
/*
if (args.length != 7) {
throw new Error('Incorrect number of arguments. Expecting 7');
}
*/
var house = {
docType: 'house',
address: args[1],
parcel: args[2],
seller: args[3],buyer: args[4],
date: args[5],
legalDesc: args[6],
contract: args[7]
};
await stub.putState(args[2], Buffer.from(JSON.stringify(house)));
console.info('============= END : Add House ===========');
}
async queryAllHouses(stub, args) {
let startKey = '';
let endKey = '';
let iterator = await stub.getStateByRange(startKey, endKey);
let allResults = [];
while (true) {
let res = await iterator.next();
if (res.value && res.value.value.toString()) {
let jsonRes = {};
console.log(res.value.value.toString('utf8'));
jsonRes.Key = res.value.key;
try {
jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
} catch (err) {
console.log(err);
jsonRes.Record = res.value.value.toString('utf8');
}
allResults.push(jsonRes);
}if (res.done) {
console.log('end of data');
await iterator.close();
console.info(allResults);
return Buffer.from(JSON.stringify(allResults));
}
}
}
};
shim.start(new Chaincode());
