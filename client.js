
const cluster = require('cluster');

var
    stats = require('./stats');

var
    SERVER_ADDRESS = 'localhost',
    SERVER_PORT = 41234;

var message = new Buffer("0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"),
    client,
    metrics = {
        sent: 0,
        received: 0,
        balance: 0,
        error: 0
    };


if (cluster.isMaster) {



    // Keep track of http requests
    var numReqs = 0;
    setInterval(() => {
        console.log('numReqs =', numReqs);
    }, 1000);

    // Count requests
    function messageHandler(msg) {
        if (msg.cmd && msg.cmd == 'received') {
            metrics.received++;
        }
        if (msg.cmd && msg.cmd == 'error') {
            metrics.error++;
        }
        if (msg.cmd && msg.cmd == 'send') {
            metrics.send++;
        }
    }

    start();
   

    // Start workers and listen for messages containing notifyRequest
    const numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    Object.keys(cluster.workers).forEach((id) => {
        cluster.workers[id].on('message', messageHandler);
    });

} else {

    startSocket();

    sendForever();



}    




function startSocket() {

    client = require('dgram').createSocket("udp4");

    client.on("message", function (msg, rinfo) {
        process.send({ cmd: 'received' });
    });
}

function send() {
    client.send(message, 0, message.length, SERVER_PORT, SERVER_ADDRESS, function(err) {
        if (err) {
            process.send({ cmd: 'error' });
        } else {
            process.send({ cmd: 'sent' });
        }
    });
}

function sendForever() {
    send();
    setImmediate(sendForever);
}

function start() {

    stats.init(metrics);
    setInterval(stats.print, 1000);

}

