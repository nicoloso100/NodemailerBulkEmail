'use strict';

const config = require('../config');
const amqplib = require('amqplib/callback_api');
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: 'smtp-relay.gmail.com',
    port: 587,
    pool: true,
    maxConnections: 20,
    secure: false,
    auth: {
        user: "",
        pass: ""
    },
    disableFileAccess: true,
    disableUrlAccess: true
}, {
        from: '"Team nuTask" <team@nutask.app>'
    });

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
            channel.prefetch(1);
            channel.consume(config.queue, data => {
                if (data === null) {
                    return;
                }
                let message = JSON.parse(data.content.toString());
                transport.sendMail(message, (err, info) => {
                    if (err) {
                        console.error(err.stack);
                        return channel.nack(data);
                    }
                    console.log('Delivered message %s', info.messageId);
                    channel.ack(data);
                });
            });
        });
    });
});
