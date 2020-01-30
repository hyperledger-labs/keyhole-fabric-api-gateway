/** 
Copyright 2018 Keyhole Software LLC

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
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('index.js');
var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http');
var cors = require('cors');
var channels = require('./endpoint/channelinfo.js');
var peers = require('./endpoint/peers.js');
var blockinfo = require('./endpoint/blockinfo.js');
var block = require('./endpoint/block.js');
var appconfig = require('./config.js');
var chaincodes = require('./endpoint/chaincodes.js');
var txproposalrate = require('./endpoint/transactionproposalrate.js');
var chaincode = require('./endpoint/executechaincode.js');
var querychaincode = require('./endpoint/querychaincode.js');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var host = appconfig.host;
var port = appconfig.port;
var loglevel = appconfig.loglevel;
logger.setLevel(loglevel);

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
    extended: false
}));

// set session properties
app.use(session({ resave: true, saveUninitialized: true, secret: 'XCR3rsasa%RDHHH', cookie: { maxAge: 60000 } }));


///////////////////////////////////////////////////////////////////////////////
//////////////////////////// START HTTP SERVER ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var httpServer = http.createServer(app).listen(port, function () { });
logger.info('********** Starting Express Server @ http://' + host + ':' + port);
httpServer.timeout = 240000;

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// START WEBSOCKET SERVER ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
logger.info('********** Configuring WebSockets');
var io = require('socket.io')(httpServer);
io.on('connection', function (socket) {
    logger.info('A new WebSocket connection has been established');
});
// Set global socket
global.socket = io;

function validateRequiredParameter(req, parameterName) {
    var parameterValue = req.body[parameterName];
    logger.info('Validating required parameter: ' + parameterName + ' with value of: ' + parameterValue);
    return parameterValue !== null && undefined !== parameterValue && parameterValue.length !== 0;
}

function validateChannelIdParameter(req) {
    return validateRequiredParameter(req, 'channelid');
}

var authvalidator;

// Check for autenticated sessions
app.all('/api/*', function (req, res, next) {

    if (appconfig.authenticate && appconfig.authenticate) {


        if (!authvalidator) {
            authvalidator = require(appconfig.authvalidator);
        }


        if (!appconfig.authvalidator) {

            logger.error("authvalidator must be defined in ../config.js, see readme for instructions");
            var err = new Error("Not Authenticated!");
            res.status(401).send("Not Authenticated");
            next(err);  //Error, trying to access unauthorized page!

        }


        if (authvalidator(req, res)) {
            next();     //If session exists, proceed to page
        } else {
            var err = new Error("Not Authenticated!");
            res.status(401).send("Not Authenticated");
            next(err);  //Error, trying to access unauthorized page!

        }
    } else {
        next()
    }
});


///////////////////////////////////////////////////////////////////////////////
////////////////////// Gateway API Endpoint Definitions  //////////////////////
///////////////////////////////////////////////////////////////////////////////
logger.info('********** Adding endpoint definitions');

app.post('/authenticate/', function (req, res) {

    if (appconfig.authhandler) {

        try {

            require(appconfig.authhandler)(req, res);


        } catch (e) {

            logger.error("Error Invoking authhandler, make sure it's a function")
            logger.error(e);
            res.status(500);
            res.send("Auth Failed");

        }

    } else {

        logger.error("authhandler not defined in config.js, see readme for info");
        res.status(500);
        res.send("Auth Failed");

    }


});



app.post('/api/execute', function (req, res) {
    logger.debug('================ /execute chaincode ======================');

    var error = null;
    var chaincodeid = null;
    var channel = null;
    var fnc = null;


    if (!req.body.fnc) {
        error = "Error, Function required";
    } else {
        fnc = req.body.fnc;
    }


    if (!req.body.channelid) {
        error = "Error, channelid required";
    } else {
        channel = req.body.channelid;
    }


    if (!req.body.chaincodeid) {
        error = "Error, Chaincodeid required";
    } else {
        chaincodeid = req.body.chaincodeid;
    }


    var args = req.body.args;
    var obj;


    try {
        //obj = JSON.parse(args);
        obj = args;
    } catch (e) {
        error = "Error, Parsing Args, check format";
        logger.error(e);
    }

    if (error != null) {
        logger.error(error);
        res.status(500);
        res.send(error);

    } else {

        chaincode.execute(channel, chaincodeid, fnc, obj)
            .then(function (message) {
                res.send(message);
            });

    }

});



app.post('/api/channel', function (req, res) {
    logger.info('================ /channel ======================');

    if (validateChannelIdParameter(req)) {
        var channelid = req.body.channelid;
        channels.getChannelInfo(channelid)
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply a `channelid` parameter and value.' }).end();
    }
});

app.post('/api/peers', function (req, res) {
    logger.info('================ /peers ======================');

    if (validateChannelIdParameter(req)) {
        var channelid = req.body.channelid;
        peers.getPeers(channelid)
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply a `channelid` parameter and value.' }).end();
    }
});


app.post('/api/blockinfo', function (req, res) {
    logger.info('================ /blockinfo ==================');

    if (validateChannelIdParameter(req)) {
        var channelid = req.body.channelid;
        blockinfo.getBlockInfo(channelid)
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply a `channelid` parameter and value.' }).end();
    }
});

app.post('/api/block', function (req, res) {
    logger.info('================ /block ======================');

    if (validateChannelIdParameter(req) && validateRequiredParameter(req, 'blocknumber') && parseInt(req.body.blocknumber)) {
        var channelid = req.body.channelid;
        var blocknumber = req.body.blocknumber;
        block.getBlock(channelid, parseInt(blocknumber))
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply both `channelid` and `blocknumber` parameters (and values).' }).end();
    }

});

app.post('/api/blockhash', function (req, res) {
    logger.info('================ /blockhash ======================');

    if (validateRequiredParameter(req, 'number') && validateRequiredParameter(req, 'prevhash') && validateRequiredParameter(req, 'datahash')) {
        var number = req.body.number;
        var prev = req.body.prevhash;
        var data = req.body.datahash;
        block.getBlockHash({ number: number, previous_hash: prev, data_hash: data })
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply values for the `number`, `prevhash`, and `datahash` parameters.' }).end();
    }
});

app.post('/api/chaincodes', function (req, res) {
    logger.info('================ /chaincodes ======================');

    if (validateChannelIdParameter(req)) {
        var channelid = req.body.channelid;
        chaincodes.getChaincodes(channelid)
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply a `channelid` parameter and value.' }).end();
    }
});

app.post('/api/channelconfig', function (req, res) {
    logger.info('================ /channelconfig ======================');

    if (validateChannelIdParameter(req) && validateRequiredParameter(req, 'blocknumber') && parseInt(req.body.blocknumber)) {
        var channelid = req.body.channelid;
        var blocknumber = req.body.blocknumber;
        block.getBlock(channelid, parseInt(blocknumber))
            .then(function (response) {
                var json = JSON.parse(response);

                // Get last config block from Metadata
                var configBlock = parseInt(json.metadata.metadata[1].value.index);
                block.getBlock(channelid, configBlock)
                    .then(function (message) {
                        res.send(message);
                    });
            });
    } else {
        res.status(400).json({ error: 'You must supply a value for both the `channelid` and `blocknumber` parameters' }).end();
    }
});

app.post('/api/txproposalrate', function (req, res) {
    logger.info('================ /txproposalrate ======================');

    if (validateChannelIdParameter(req) && validateRequiredParameter(req, 'chaincode')) {
        var channelid = req.body.channelid;
        var chaincode = req.body.chaincode;
        txproposalrate.getTransactionProposalRate(channelid, chaincode)
            .then(function (message) {
                res.send(message);
            });
    } else {
        res.status(400).json({ error: 'You must supply a value for both the `channelid` and `chaincode` parameters' }).end();
    }
});

// All remaining requests are invalid, as we aren't serving up static content here.
app.get('*', function (request, response) {
    logger.error(request.url);
    logger.error(request.method);
    response.status(404).end();
});

logger.info('********** Express Server started successfully.');
