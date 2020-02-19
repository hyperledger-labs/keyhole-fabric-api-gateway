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

var futil = require('util');
var config = require('../config.js');
var log4js = require('log4js');
var logger = log4js.getLogger('endpoint/createLab.js');
var util = require('./util');

var channel = {};
var tx_id = null;


logger.setLevel(config.loglevel);

var execute = function (channel_id, chaincode, fnc, args) {
    return Promise.resolve().then(() => {
        return util.connectChannel(channel_id);
    }).then((c) => {
        logger.debug("Make query");
        channel = c;
        tx_id = util.getClient().newTransactionID();
        logger.debug("Assigning transaction_id: " + tx_id._transaction_id);

        // queryCar - requires 1 argument, ex: args: ['CAR4'],
        // queryAllCars - requires no arguments , ex: args: [''],
        console.log("labs" + JSON.stringify(args));

        logger.debug("chaincode " + chaincode + " - " + fnc + " - " + args.length);
        const request = {
            targets: util.targets,
            chaincodeId: chaincode,
            txId: tx_id,
            fcn: fnc,
            args: args,

        };
        return channel.sendTransactionProposal(request);
    }).then((results) => {
        var proposalResponses = results[0];
        var proposal = results[1];
        var header = results[2];
        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
            isProposalGood = true;
            logger.debug('transaction proposal was good');
        } else {
            logger.error('transaction proposal was bad');
        }
        if (isProposalGood) {
            logger.debug(futil.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));
            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal,
                header: header
            };
            // set the transaction listener and set a timeout of 30sec
            // if the transaction did not get committed within the timeout period,
            // fail the test
            var transactionID = tx_id.getTransactionID();
            var eventPromises = [];

            let eh = channel.newChannelEventHub(util.getPeer());
            eh.connect();

            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    eh.disconnect();
                    reject();
                }, 30000);

                eh.registerTxEvent(transactionID, (tx, code) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(transactionID);
                    eh.disconnect();

                    if (code !== 'VALID') {
                        logger.error(
                            'The transaction was invalid, code = ' + code);
                        reject();
                    } else {
                        logger.info(
                            'The transaction has been committed on peer ' +
                            eh.getPeerAddr());
                        resolve();
                    }
                });
            });
            eventPromises.push(txPromise);
            var sendPromise = channel.sendTransaction(request);
            return Promise.all([sendPromise].concat(eventPromises)).then((results) => {
                logger.debug(' event promise all complete and testing complete');
                return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
            }).catch((err) => {
                logger.error(
                    'Failed to send transaction and get notifications within the timeout period.'
                );
                return 'Failed to send transaction and get notifications within the timeout period.';
            });
        } else {
            logger.error(
                'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
            );
            return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...';
        }
    }, (err) => {
        console.error('Failed to send proposal due to error: ' + err.stack ? err.stack :
            err);
        return 'Failed to send proposal due to error: ' + err.stack ? err.stack :
            err;
    }).then((response) => {
        if (response.status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.');
            util.done(channel_id);
            return "Transaction has been Ordered: " + chaincode + "(" + fnc + ") tx:" + tx_id.getTransactionID();
        } else {
            console.error('Failed to order the transaction. Error code: ' + response.status);
            util.done(channel_id);
            return 'Failed to order the transaction. Error code: ' + response.status;
        }
    }, (err) => {
        console.error('Failed to send transaction due to error: ' + err.stack ? err
            .stack : err);
        util.removeChannel(channel_id);
        return 'Failed to send transaction due to error: ' + err.stack ? err.stack :
            err;
    });
}

exports.execute = execute;
