'use strict';
/** 
Copyright 2019 Keyhole Labs LLC

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

var util = require('util');
var config = require('../config.js');
var log4js = require('log4js');
var logger = log4js.getLogger('endpoint/chaincodes.js');
logger.setLevel(config.loglevel);

var util = require('./util.js');

var getChaincodes = function (channel_id) {
    return Promise.resolve().then(() => {
        return util.connectChannel(channel_id);
    }).then((c) => {
        return c.queryInstantiatedChaincodes(this.target, true);
    }).then((query_responses) => {
        logger.debug("returned from query" + JSON.stringify(query_responses));
        return JSON.stringify(query_responses);
    }).catch((err) => {
        logger.error("ERROR - Caught Error", err);
    });
};

exports.getChaincodes = getChaincodes;
