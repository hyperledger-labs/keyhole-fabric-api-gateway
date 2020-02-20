/* 

  API Gateway integration tests, assumes the KEYHOLE-FABRIC-API-GATEWAY is up and 
  running on the specified HOST argument.  
  
  Thes API calls can be made to any Gateway server instance since they do not test 
  chaincode API calls. See chaincodetest.js for chaincode examples. 

  Usage Example:

     $ node apitest.js http://localhost:9090 mychannel

*/

const axios = require('axios');

// Get command line args Server Host and Channel Id required 
var args = process.argv;
console.log(args);
if (args.length < 4) {
    console.log("Usage Error: <server url> and <channelid> required as command line args");
    return;
}

// Set Host
const host = args[2];
// Set Channel id
const channelid = args[3];

/**
 * 
 *   api/peers
 * 
 */

axios
  .post(host+'/api/peers', {
    channelid: channelid
  })
  .then(res => {
    console.log(`----- api/peers results -----`)
    console.log(`statusCode: ${res.status}`)
    console.log("Peers: "+res.data)
  })
  .catch(error => {
    console.error(error)
  })

/**  
*
*    api/poolinfo
*
*/
axios
.post(host+'/api/poolinfo', {
})
.then(res => {
  console.log(`----- api/poolinfo results -----`)
  console.log(`statusCode: ${res.status}`)
  console.log(res.data)
})
.catch(error => {
  console.error(error)
})


/**  
*
*    api/blockinfo
*
*/
axios
.post(host+'/api/blockinfo', {
    channelid: channelid
})
.then(res => {

  console.log(`statusCode: ${res.status}`)
  console.log(`----- api/blockinfo results -----`)
  console.log(res.data)
})
.catch(error => {
  console.error(error)
})


/**  
*
*    api/channelconfig
*
*/
axios
.post(host+'/api/channelconfig', {
    channelid: channelid,
    blocknumber: 1
})
.then(res => {

  console.log(`statusCode: ${res.status}`)
  console.log(`----- api/channelconfig results -----`)
  console.log(res.data)
})
.catch(error => {
  console.error(error)
})


/**  
*
*    api/chaincodes
*
*/
axios
.post(host+'/api/chaincodes', {
    channelid: channelid
})
.then(res => {

  console.log(`statusCode: ${res.status}`)
  console.log(`----- api/chaincodes results -----`)
  console.log(res.data)
})
.catch(error => {
  console.error(error)
})
