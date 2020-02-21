'use strict';
/** 
Copyright 2018 Keyhole Labs LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var client = require('fabric-client');
var config = require('../config.js');
var log4js = require('log4js');
var logger = log4js.getLogger('endpoint/querchaincode.js');
var util = require('./util.js');

var execute = function (channel_id,chaincode,query,args) {
   
    return Promise.resolve().then(() => {
        return util.connectChannel(channel_id);
    }).then((channel) => {
        logger.debug("Make query");
        var transaction_id = util.getClient().newTransactionID();
        logger.debug("Assigning transaction_id: ", transaction_id._transaction_id);

        const request = {
            chaincodeId: chaincode,
            txId: transaction_id,
            fcn: query,
            args: args
        };
        return channel.queryByChaincode(request);
    }).then((query_responses) => {
        logger.debug("returned from query");
        if (!query_responses.length) {
            logger.debug("No payloads were returned from query");
        } else {
            logger.debug("Query result count = ", query_responses.length)
        }
        if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0]);
        }
        logger.debug("Response is ", query_responses[0].toString());
        util.done(channel_id);
        return query_responses[0].toString();
    }).catch((err) => {
        util.removeChannel(channel_id);
        console.error("Caught Error", err);
    });
};


exports.execute = execute;
