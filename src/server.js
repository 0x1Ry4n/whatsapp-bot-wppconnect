const express = require('express')
const helmet = require('helmet');
const bodyParser = require('body-parser');
const sheetsRoute = require("./controllers/databaseController");
const http = require("http");
const prisma = require("./config/mongoDb");
const port = require("./config/port");
const logger = require("./config/logger");
const { messageListener } = require('./controllers/messageController');
require("dotenv").config()

const app = express()
const server = http.createServer(app);

async function main() {
    app.use(helmet())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json({ limit: '1mb' }))
    app.use(express.json())

    app.use("/api/healthchecker", (req, res) => {
        res.send("Hello!")
    })

    app.use("/api/schedulings", sheetsRoute);

    app.use('*', (req, res, next) => {
        res.status(404).json({
            message: "404 Resource not found"
        })
    })

    server.listen(port, (err) => {
        try {
            if (err) console.log(err)
            console.log("Server listening on Port", port);
        } catch (error) {
            console.log(e)
            throw new HttpException('Server Error', 500);
        }
    })
}

main()
    .then(async () => {
        await prisma.$connect()
        await messageListener()
    })
    .catch(async (error) => {
        logger.error(error);
        await prisma.$disconnect()
        process.exit(1)
    })




