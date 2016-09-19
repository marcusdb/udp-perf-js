const cluster = require('cluster');
const http = require('http');


var
    dgram = require("dgram");

var
    SERVER_PORT = 41234;

var
    nReceived = 0,
    server = dgram.createSocket("udp4");

if (cluster.isMaster) {

    // Keep track of http requests
    var numReqs = 0;
    setInterval(() => {
        console.log('numReqs =', numReqs);
    }, 1000);

    // Count requests
    function messageHandler(msg) {
        if (msg.cmd && msg.cmd == 'notifyRequest') {
            numReqs += 1;
        }
    }

    setInterval(function () {
        console.info(numReqs);
        numReqs = 0;
    }, 1000);

    // Start workers and listen for messages containing notifyRequest
    const numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    Object.keys(cluster.workers).forEach((id) => {
        cluster.workers[id].on('message', messageHandler);
    });

} else {

    server.on("error", function (err) {
        console.log("server error:\n" + err.stack);
        server.close();
    });

    server.on("message", function (msg, rinfo) {
        process.send({ cmd: 'notifyRequest' });
    });

    server.on("listening", function () {
        var address = server.address();
        console.log("server listening " +
            address.address + ":" + address.port);
    });



    server.bind(SERVER_PORT);



}



