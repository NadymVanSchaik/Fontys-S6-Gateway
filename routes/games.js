const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var jsonParser = bodyParser.json();


router.get('/all', (req, res) => {
  sendMessage("getAllMessages", "getAllMessages")
});

var amqplib = require('amqplib');
var amqp = require('amqplib/callback_api')
const amqpUrl = process.env.AMQP_URL || 'amqp://localhost:5673';


async function sendMessage(queueName, msg) {
  const connection = await amqplib.connect(amqpUrl);
  const channel = await connection.createChannel();
  const queue = await channel.assertQueue('', {exclusive: true});
  const uuid = generateUuid();

  //Send first message
  channel.sendToQueue(queueName, Buffer.from(msg)), {
    replyTo: queue.queue,
    correlationId: uuid,
  }
  console.log('Sent:' , msg)

  //Consume response
  channel.consume(queue.queue, msg => {
    if(msg.properties.correlationId === uuid){
      //TODO Do something with the msg
      
      setTimeout(() => {
        connection.close();
        process.exit(0);
      }, 500)

      return msg
    } 
  }, {noAck: true});
}

function generateUuid() {
  return Math.random().toString() +
      Math.random().toString() +
      Math.random().toString();
}

module.exports = router