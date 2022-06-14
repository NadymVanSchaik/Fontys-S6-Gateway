const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var jsonParser = bodyParser.json();


router.get('/all', async (req, res) => {
  console.log("Starting function")
  const ret = await sendMessage("getAllGames", {value: "getAllGames"});
  console.log("THIS IS WHAT IS RETURNED BITCH ", ret)
  console.log(Date.now());
  res.json(ret)
});

var amqplib = require('amqplib');
const amqpUrl = process.env.AMQP_URL;


async function sendMessage(queueName, msg) {
  const connection = await amqplib.connect(amqpUrl);
  const channel = await connection.createChannel();
  const queue = await channel.assertQueue('', {exclusive: true, durable: false});
  const uuid = generateUuid();

  msg = JSON.stringify({
    value: msg.value,
    replyTo: queue.queue,
    id: "server-command"
  });

  //Send first message
  channel.sendToQueue(queueName, Buffer.from(msg)), {
    replyTo: queue.queue,
    correlationId: uuid,
  }

  //Consume response
  //TODO  This has to be resolved before return to call is given
  channel.consume(queue.queue, msg => {
    console.log(msg.content.toString())
    if(JSON.parse(msg.content.toString()).id === "games-response"){
      //TODO Do something with the msg
      console.log("Got message: ", msg)
      console.log(Date.now());
      connection.close();
      return JSON.parse(msg.content.toString()).value
    } 
  }, {noAck: true});
}

function generateUuid() {
  return Math.random().toString() +
      Math.random().toString() +
      Math.random().toString();
}

module.exports = router