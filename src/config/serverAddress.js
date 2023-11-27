const serverAddress = process.env.SERVER_ADDRESS ?? "http://localhost";
const consultorioAddress = process.env.CONSULTORIO_API_ADDRESS;

module.exports = { serverAddress, consultorioAddress };