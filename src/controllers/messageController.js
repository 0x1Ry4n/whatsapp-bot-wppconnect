const { createSession } = require("../config/client");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const phoneFormatter = require("../helpers/formatPhoneNumber");

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

// A questão principal é: Como ligar o google sheets com o wppconnect?

async function sender() {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: errors.mapped(),
            });
        }

        const client = await botClient;

        // criar as mensagens personalizadas do paciente e médico a partir da linha na página do google sheets
        const clientMessages = createClientMessage() // passar o body da planilha aqui
        const professionalMessages = createProfessionalMessage() // passar o body da planilha aqui

        const clientFormattedPhone = phoneFormatter() // passar o número de telefone do cliente para formatar '@c.us'
        const professionalFormattedPhone = phoneFormatter() // passar o número de telefone do profissional para formatar '@c.us'

        const responseClient = await sendMessage(client, clientFormattedPhone, clientMessages["0"]); // enviar mensagem para o paciente avisando que o agendamento chegou

        if (!responseClient) {
            return res.status(500).json({
                status: false,
                response: "Falha ao enviar a mensagem para o cliente!",
            });
        }

        const responseProfessional = await sendMessage(client, professionalFormattedPhone, professionalMessages["0"]); // enviar mensagem para o doutor perguntando se confirma o agendamento

        if (!responseProfessional) {
            return res.status(500).json({
                status: false,
                response: "Falha ao enviar a mensagem para o profissional!",
            });
        }

        console.log(responseClient, responseProfessional);

        res.status(200).json({
            status: true,
            response: "Mensagem enviada com sucesso!",
        });

    } catch (error) {
        next(error);
    }
}

// ouvir a resposta do doutor para a confirmação e passar as mensagens personalizadas como feito no sender

async function messageListener() {
    const client = await botClient;

    const listener = client.onAnyMessage(async (message) => {
        const isMsgValid = /[1|2]/.test(message.body);
        const isContactMsg = message.isGroupMsg === false;

        if (isMsgValid && isContactMsg) {
            if (message.body.toString() === "1") {
                sendMessage(client, telefoneProfissional, messagesProfissional["1"]);
                sendMessage(client, telefoneCliente, messagesCliente["1"]);
                sendMessage(client, telefoneCliente, messagesCliente["3"]);
            } else {
                sendMessage(client, telefoneCliente, messagesCliente["2"]);
                sendMessage(client, telefoneCliente, messagesCliente["3"]);
            }

            listener.dispose();
        }
    });
}

module.exports = { sender, messageListener } // preciso utilizar essas funções