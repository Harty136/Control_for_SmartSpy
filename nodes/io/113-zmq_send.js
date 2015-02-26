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
        
    var ZMQConnectionPool = function() {
        var connections = {};
        var obj = {
            get: function(socket,host,port,msg,topic) {
                var link = 'tcp://'+host+':'+port;
                var id = host+':'+port+'|'+socket
                if (socket=='pub') {
                        msg = topic+' '+msg
                        }
                if (!connections[id]) {
                    if (socket=='req'||socket=='pair') {
                        connections[id] = zmq.socket(socket).connect(link);
                        //util.log("[ZMQ send] connected to "+id);
                    }
                    if (socket=='pub' || socket=='push') {
                        connections[id] = zmq.socket(socket).bind(link, function(err) {
                                if(err) util.log('[ZMQ send][error] '+err)
                                //else    util.log("[ZMQ send] connected to "+id)                              
                                })
                    }
                }
                connections[id].send(msg)
                //util.log(connections[id].type+'         '+msg+' sent')
                return connections[id];
            },
            close: function(id) {
                        if (connections[id]) {
                                connections[id].close();
                                util.log('[ZMQ send]'+id + ' --> client closed')             
                                delete connections[id];
                                }
            }
            
        };
        return obj;
    }();
 
    
    function ZMQOutNode(n) {
        RED.nodes.createNode(this,n);
        this.port = n.port||"5555";
        this.hostname = n.hostname||"172.16.8.0";
        this.socket = n.socket;
        this.topic = n.topic;

        this.client;
        this.on("input", function(msg) {
                if (msg != null) {
                        var tc = this.topic || msg.topic
                        this.client = ZMQConnectionPool.get(this.socket,this.hostname,this.port, msg, tc)
                }
                
        });
    }
    
    RED.nodes.registerType("zmq send",ZMQOutNode);
    ZMQOutNode.prototype.close = function() {
        ZMQConnectionPool.close(this.hostname+':'+this.port+'|'+this.socket);
    }

}

