//import kefir from 'kefir';
import cluster from 'cluster';
import webServer from './web-server';
//import outboundMessages from './messages/outbound';

//outboundMessages
//  .onValue(msg => kefir
//    .fromNodeCallback(cb => msg.client.send(JSON.stringify(msg.message), cb))
//    .onError(err => msg.client.close())
//  );

webServer
  .onValue(() => {
    if (cluster.isMaster) {
      console.log('User interface listening at http://localhost:8080/');
    }
  });