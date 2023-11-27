const axios = require("axios");
const { serverAddress, consultorioAddress } = require("./serverAddress");
const serverPort = require("./port");
const timeout = 5000

const consultorioInstance = axios.create({
    baseURL: `${consultorioAddress}`,
    timeout: timeout,
    headers: {
        "Content-Type": "application/json"
    },
});

const localInstance = axios.create({
    baseURL: `${serverAddress}:${serverPort}`,
    timeout: timeout,
    headers: {
        "Content-Type": "application/json"
    },
});

module.exports = { consultorioInstance, localInstance }