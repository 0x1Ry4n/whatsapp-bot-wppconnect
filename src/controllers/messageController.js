const { createSession } = require("../config/client");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const axios = require("axios");
const port = require("../config/port")

const botClient = createSession()

async function sendMessage(client, target, message) {
    try {
        const response = await client.sendText(target, message);

        if (!response) {
            throw new Error("Não foi possível enviar a mensagem");
        }

        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function sender(data) {
    try {
        const client = await botClient;

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data)

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        const responseClient = await sendMessage(client, clientFormattedPhone, clientMessages["0"]);

        if (!responseClient) {
            return false;
        }

        const responseProfessional = await sendMessage(client, professionalFormattedPhone, professionalMessages["0"]); // enviar mensagem para o doutor perguntando se confirma o agendamento

        if (!responseProfessional) {
            return false;
        }

        console.log(responseClient, responseProfessional);

        return true;
    } catch (error) {
        console.log("Erro ao enviar as mensagens: ", error);
        return false;
    }
}

async function messageListener() {
    const client = await botClient;

    client.onAnyMessage(async (message) => {
        const isMsgValid = /[1|2]/.test(message.body);
        const isContactMsg = message.isGroupMsg === false;

        console.log(message)

        if (!isContactMsg) {
            return;
        }

        const params = {
            range: "Página1",
            column: "telefoneProfissional",
            value: message.from
        }

        console.log("Quem mandou mensagem: ", message.from)

        const response = await axios.get(`http://localhost:${port}/api/sheets/isKnowedNumber`, {
            params
        })

        console.log("Resposta do axios: ", response.data);

        if (!response.data?.result) {
            sendMessage(client, message.from, "Número desconhecido!");
            return
        }

        const data = response.data?.data[0]

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data) // passar o body da planilha aqui

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        if (isMsgValid && isContactMsg) {
            if (message.body.toString() === "1") {
                sendMessage(client, professionalFormattedPhone, professionalMessages["1"]);
                sendMessage(client, clientFormattedPhone, clientMessages["1"]);
                sendMessage(client, clientFormattedPhone, clientMessages["3"]);
            } else if (message.body.toString() === "2") {
                sendMessage(client, clientFormattedPhone, clientMessages["2"]);
                sendMessage(client, clientFormattedPhone, clientMessages["3"]);
            }
            return
        }
    });
}

module.exports = { sender, messageListener } 