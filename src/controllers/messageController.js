const { createSession } = require("../config/client");
const { localInstance } = require("../config/axiosInstance");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const logger = require("../config/logger");

const botClient = createSession("teste")

class WhatsappBotController {
    static async sendMessage(client, target, message) {
        try {
            const response = await client.sendText(target, message);

            if (!response) {
                throw new Error("Unable to send a message!");
            }

            return response;
        } catch (error) {
            logger.error(`Error to send message: ${error}`)
            throw error;
        }
    }

    static async patientSender(data) {
        try {
            const client = await botClient;

            const clientMessages = createClientMessage(data)
            const professionalMessages = createProfessionalMessage(data);

            const clientFormattedPhone = data?.telefoneCliente
            const professionalFormattedPhone = data?.telefoneProfissional

            const [responseClient, responseProfessional] = await Promise.all([
                WhatsappBotController.sendMessage(client, clientFormattedPhone, clientMessages["0"]),
                WhatsappBotController.sendMessage(client, professionalFormattedPhone, professionalMessages["0"])
            ])

            if (!responseClient || !responseProfessional) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error(`Error to send register scheduling messages: ${error}`)
            return false;
        }
    }

    static async messageListener() {
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

            const responseFiltered = await localInstance.get("/api/schedulings/filterScheduling", {
                params,
                headers: {
                    'Authorization': `${process.env.SECRET_TOKEN}`
                }
            })

            if (!responseFiltered.data) {
                return
            }

            const data = responseFiltered.data?.data[0]

            const clientMessages = createClientMessage(data)
            const professionalMessages = createProfessionalMessage(data)

            const clientFormattedPhone = data?.telefoneCliente
            const professionalFormattedPhone = data?.telefoneProfissional

            switch (message.body.toString()) {
                case "0": {
                    await WhatsappBotController.sendMessage(client, professionalFormattedPhone, professionalMessages["0"]);
                    return
                }
                case "1": {
                    const params = {
                        id: data.id,
                        agendado: true
                    }

                    await localInstance.post("/api/schedulings/updateSchedulingStatus", {}, {
                        params: params,
                        headers: {
                            'Authorization': `${process.env.SECRET_TOKEN}`
                        }
                    })

                    await Promise.all([
                        WhatsappBotController.sendMessage(client, professionalFormattedPhone, professionalMessages["1"]),
                        WhatsappBotController.sendMessage(client, clientFormattedPhone, clientMessages["1"]),
                        WhatsappBotController.sendMessage(client, clientFormattedPhone, clientMessages["3"]),
                    ])

                    return
                }
                case "2": {
                    const params = {
                        id: data.id,
                        agendado: true
                    }

                    await localInstance.post("/api/schedulings/updateSchedulingStatus", {}, {
                        params: params,
                        headers: {
                            'Authorization': `${process.env.SECRET_TOKEN}`
                        }
                    })

                    await Promise.all([
                        WhatsappBotController.sendMessage(client, clientFormattedPhone, clientMessages["2"]),
                        // WhatsappBotController.sendMessage(client, `${process.env.SUPPORT_PHONE_NUMBER}`, clientMessages["4"]),
                    ])

                    return
                }
            }
        });
    }
}


module.exports = WhatsappBotController;