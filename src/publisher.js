'use strict';

const amqplib = require('amqplib/callback_api');
const config = require('../config');

amqplib.connect(config.amqp, (err, connection) => {
    if (err) {
        console.error(err.stack);
        return process.exit(1);
    }
    connection.createChannel((err, channel) => {
        if (err) {
            console.error(err.stack);
            return process.exit(1);
        }
        channel.assertQueue(config.queue, {
            durable: true
        }, err => {
            if (err) {
                console.error(err.stack);
                return process.exit(1);
            }
            let sender = (content, next) => {
                let sent = channel.sendToQueue(config.queue, Buffer.from(JSON.stringify(content)), {
                    persistent: true,
                    contentType: 'application/json'
                });
                if (sent) {
                    return next();
                } else {
                    channel.once('drain', () => next());
                }
            };

            let sent = 0;
            let messageList = MessageList();
            let sendNext = () => {
                if (sent >= messageList.length) {
                    console.log(`All ${messageList.length} messages have been sent`);
                    return channel.close(() => connection.close());
                }
                sent++;
                sender(messageList[sent - 1], sendNext);
            };

            sendNext();

        });
    });
});

function MessageList() {
    let messages = [
        {
            to: 'nicolas-angaritao@unilibre.edu.co',
            subject: 'Test message',
            text: 'realizando prueba de mensajes del team nuTask'
        },
        {
            to: 'nico.las0315@hotmail.com',
            subject: 'Test message',
            text: 'realizando prueba de mensajes del team nuTask'
        },
        {
            to: 'nico0315@yahoo.com',
            subject: 'Test message',
            text: 'realizando prueba de mensajes del team nuTask'
        },
        {
            to: 'nicolas.angaritao@unilibrebog.edu.co',
            subject: 'Test message',
            text: 'realizando prueba de mensajes del team nuTask'
        }
    ]
    return messages;
}