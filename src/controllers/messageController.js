const { createSession } = require("../config/client");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const phoneFormatter = require("../helpers/formatPhoneNumber");
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

async function patientSender(data) {
    try {
        const client = await botClient;

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data);

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        const responseClient = await sendMessage(client, clientFormattedPhone, clientMessages["0"]);

        if (!responseClient) {
            return false;
        }

        const responseProfessional = await sendMessage(client, professionalFormattedPhone, professionalMessages["0"]);

        if (!responseClient) {
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
        const isMsgValid = /[0|1|2]/.test(message.body);
        const isContactMsg = message.isGroupMsg === false;
        const isMsgToBot = message.to === process.env.BOT_PHONE_NUMBER

        if (!isContactMsg || !isMsgValid || !isMsgToBot) return

        const params = {
            telefoneProfissional: message.from,
            agendado: false
        }

        const responseFiltered = await axios.get(`http://localhost:${port}/api/schedulings/filterData`, {
            params
        })

        console.log("Resposta do axios: ", responseFiltered.data);

        const data = responseFiltered.data?.data[0]

        const clientMessages = createClientMessage(data)
        const professionalMessages = createProfessionalMessage(data)

        const clientFormattedPhone = data?.telefoneCliente
        const professionalFormattedPhone = data?.telefoneProfissional

        console.log("Quem mandou mensagem: ", message.from)

        switch (message.body.toString()) { // enviar novo agendamento encontrado para o profissional
            case "0": {
                await sendMessage(client, professionalFormattedPhone, professionalMessages["0"]);
                return
            }
            case "1": { // enviar confirmação
                await sendMessage(client, professionalFormattedPhone, professionalMessages["1"]);

                const params = {
                    id: data.id,
                    agendado: true
                }

                const response = await axios.post(`http://localhost:${port}/api/schedulings/updateScheduling`, {}, {
                    params: params
                })

                console.log(response);

                await sendMessage(client, clientFormattedPhone, clientMessages["1"]);
                await sendMessage(client, clientFormattedPhone, clientMessages["3"]);

                return
            }
            case "2": { // enviar rejeição
                await sendMessage(client, clientFormattedPhone, clientMessages["2"]);
                await sendMessage(client, clientFormattedPhone, clientMessages["3"]);
                return
            }
        }
    });
}

module.exports = { patientSender, messageListener } 