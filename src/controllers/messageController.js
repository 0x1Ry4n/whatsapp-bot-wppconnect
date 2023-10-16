const { createSession } = require("../config/client");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const axios = require("axios");
const serverAddress = require("../config/serverAddress");
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

async function patientSender(data) {
    try {
        const client = await botClient;

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data);

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        const [responseClient, responseProfessional] = await Promise.all([
            sendMessage(client, clientFormattedPhone, clientMessages["0"]),
            sendMessage(client, professionalFormattedPhone, professionalMessages["0"])
        ])

        if (!responseClient || !responseProfessional) {
            return false;
        }

        return true;
    } catch (error) {
        console.log("Erro ao enviar as mensagens: ", error);
        return false;
    }
}

async function messageListener() {
    const client = await botClient;

    client.onAnyMessage(async (message) => {
        const isMsgValid = /[0|1|2]/.test(message.body);
        const isContactMsg = message.isGroupMsg === false;
        const isMsgToBot = message.to === process.env.BOT_PHONE_NUMBER

        if (!isContactMsg || !isMsgValid || !isMsgToBot) return

        const params = {
            telefoneProfissional: message.from,
            agendado: false
        }

        const responseFiltered = await axios.get(`${serverAddress}:${port}/api/schedulings/filterData`, {
            params,
            headers: {
                'Authorization': `${process.env.SECRET_TOKEN}`
            }
        })

        if (!responseFiltered.data) {
            return
        }

        console.log("Resposta do axios: ", responseFiltered.data);

        const data = responseFiltered.data?.data[0]

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data)

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        console.log("Quem mandou mensagem: ", message.from)

        switch (message.body.toString()) {
            case "0": {
                await sendMessage(client, professionalFormattedPhone, professionalMessages["0"]);
                return
            }
            case "1": {
                await sendMessage(client, professionalFormattedPhone, professionalMessages["1"]);

                const params = {
                    id: data.id,
                    agendado: true
                }

                const response = await axios.post(`${serverAddress}:${port}/api/schedulings/updateScheduling`, {}, {
                    params: params,
                    headers: {
                        'Authorization': `${process.env.SECRET_TOKEN}`
                    }
                })

                console.log(response);

                await Promise.all([
                    sendMessage(client, clientFormattedPhone, clientMessages["1"]),
                    sendMessage(client, clientFormattedPhone, clientMessages["3"]),
                ])

                return
            }
            case "2": {
                await Promise.all([
                    sendMessage(client, clientFormattedPhone, clientMessages["2"]),
                    sendMessage(client, clientFormattedPhone, clientMessages["4"]),
                ])

                return
            }
        }
    });
}

module.exports = { patientSender, messageListener } 