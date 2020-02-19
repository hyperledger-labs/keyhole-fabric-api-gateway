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
var util = require('./util.js');
var config = require('../config.js');
var log4js = require('log4js');
var logger = log4js.getLogger('endpoint/poolinfo.js');

logger.setLevel(config.loglevel);

var getPoolInfo = function () {
    return Promise.resolve().then(() => {
        return util.poolInfo();
    }).then((info) => {
        return info;
    }).catch((err) => {
        logger.error("Caught Error", err);
        return "Error " + err;
    });
};

exports.getPoolInfo = getPoolInfo;
