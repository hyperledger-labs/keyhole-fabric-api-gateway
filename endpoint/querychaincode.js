'use strict';
/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var hfc = require('fabric-client');
var config = require('../config.js');
var log4js = require('log4js');
var logger = log4js.getLogger('endpoint/query.js');
var fs = require('fs');
var os = require('os');
var npath = require('path');

var channel = {};
var client = null;
var path = config.wallet_path;

var query = function (channel,chaincode,query) {
    logger.debug("OS user info is: " + JSON.stringify(os.userInfo()));
    logger.debug("default hfc-key-store directory is: " + npath.join(os.homedir(), ".hfc-key-store"));
    logger.debug("Using config: " + JSON.stringify(config));
    return Promise.resolve().then(() => {
        logger.debug("Create a client and set the wallet location");
        client = new hfc();
        logger.debug("Using wallet path: " + path);
        return hfc.newDefaultKeyValueStore({ path: path });
    }).then((wallet) => {
        logger.debug("Received wallet: " + JSON.stringify(wallet));
        logger.debug("Setting the wallet path, and associating user " + config.user_id);
        client.setStateStore(wallet);
        return client.getUserContext(config.user_id, true);
    }).then((user) => {
        logger.debug("Check user is enrolled, and set a query URL in the network");
        if (!user || !user.isEnrolled()) {
            logger.error("User not defined, or not enrolled - error");
        }
        channel = client.newChannel(config.channel_id);
        channel.addPeer(client.newPeer(config.network_url));
        return;
    }).then(() => {
        logger.debug("Make query");
        var transaction_id = client.newTransactionID();
        logger.debug("Assigning transaction_id: ", transaction_id._transaction_id);

        const request = {
            chaincodeId: chaincode,
            txId: transaction_id,
            fcn: query,
            args: ['']
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
        return query_responses[0].toString();
    }).catch((err) => {
        console.error("Caught Error", err);
    });
};


exports.query = query;
