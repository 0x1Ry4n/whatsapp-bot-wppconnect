const express = require('express')
const helmet = require('helmet');
const bodyParser = require('body-parser');
const sheetsRoute = require("./controllers/sheetsController");
const http = require("http");
require("dotenv").config()

const app = express()
const server = http.createServer(app);
const port = process.env.SERVER_PORT ?? 3000

app.use(helmet())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())

app.use("/api/sheets", sheetsRoute);

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


