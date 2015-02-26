/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    var util = require("util");
    var zmq = require("zmq");
    var msg = {};
    var servers = {};
    var flag = 0; // flag per indicare se ci sono connessioni attive da chiudere
    
    function ZMQInNode(n) {
        flag = 1; // esiste almeno una connessione attiva
        RED.nodes.createNode(this,n);
        this.port = n.port||"5555";
        this.hostname = n.hostname||"172.16.8.0";
        this.socket = n.socket;
        this.topic = '['+n.topic+']'
        
        var id = this.hostname+':'+this.port+':'+this.socket
        var node = this;

        this.server = zmq.socket(this.socket)
        if (this.socket=='rep'|| this.socket=='pair') { 
                this.server.bind('tcp://'+this.hostname+':'+this.port, function(err) {
                        if(err) util.log('[ZMQ rec][error] '+err)
                        else util.log("[ZMQ] open port: "+node.hostname+':'+node.port+'|'+node.socket)
                })
        }
        if (this.socket=='sub') { 
                this.server.connect('tcp://'+this.hostname+':'+this.port )
                tc=eval(this.topic)
                for (var i in tc) {
                        this.server.subscribe(tc[i]);
                        };
                util.log("[ZMQ] open port: "+node.hostname+':'+node.port+'|'+node.socket)
        }
        if (this.socket=='pull') { 
                this.server.connect('tcp://'+this.hostname+':'+this.port )
                util.log("[ZMQ] open port: "+node.hostname+':'+node.port+'|'+node.socket)
        }
        
        servers[id]=this.server

        servers[id].on("message", function(obj) {
                msg.topic = 'msg from '+node.hostname+':'+node.port
                msg.payload = obj.toString()
                node.send(msg)
                //util.log('received:'+obj)
                if (node.socket == 'rep') servers[id].send(obj) // se il socket è di tipo rep è necessario inviare una risposta
        });
    }
    
    RED.nodes.registerType("zmq rec",ZMQInNode);
 
    ZMQInNode.prototype.close = function() {
        if (flag==1) {
                        for (var id in servers) servers[id].close();
                        flag = 0
                        util.log('[ZMQ rec] ALL server closed')
                }
    }

}

