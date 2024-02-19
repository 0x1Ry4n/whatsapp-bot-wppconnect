const { createSession } = require("../config/client");
const { localInstance } = require("../config/axiosInstance");
const { createClientMessage, createProfessionalMessage } = require("../helpers/createMessages");
const logger = require("../config/logger");

const botClient = createSession("production");

class WhatsappBotController {
  static async sendMessage(client, target, message) {
    try {
      const messageResponse = await client.sendText(target, message);

      if (!messageResponse) throw new Error("Unable to send a message!");
      

      return messageResponse;
    } catch (error) {
      logger.error(`Error to send message: ${error}`);
      throw error;
    }
  }

  static async statusSender(data) {
    try {
      const client = await botClient;

      const clientMessages = createClientMessage(data);

      const clientResponse = await WhatsappBotController.sendMessage(
        client,
        data.telefoneCliente,
        clientMessages["5"]
      );

      if (!clientResponse) return false;

      return true;
    } catch (error) {
      logger.error(`Error to send status messages: ${error}`);
      return false;
    }
  }

  static async patientSender(data) {
    try {
      const client = await botClient;

      const clientMessages = createClientMessage(data);
      const professionalMessages = createProfessionalMessage(data);

      const [clientResponse, professionalResponse] = await Promise.all([
        WhatsappBotController.sendMessage(
          client,
          data.telefoneCliente,
          clientMessages["0"]
        ),
        WhatsappBotController.sendMessage(
          client,
          data.telefoneProfissional,
          professionalMessages["0"]
        ),
      ]);

      if (!clientResponse || !professionalResponse) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Error to send register scheduling messages: ${error}`);
      return false;
    }
  }

  static async messageListener() {
    const client = await botClient;

    client.onAnyMessage(async (message) => {
      const isMsgValid = /[0|1|2]/.test(message.body);
      const isContactMsg = message.isGroupMsg === false;
      const isMsgToBot = message.to === process.env.BOT_PHONE_NUMBER;

      if (!isContactMsg || !isMsgValid || !isMsgToBot) return;

      const params = {
        telefoneProfissional: message.from,
        agendado: false,
      };

      const responseFiltered = await localInstance.get(
        "/api/schedulings/filterScheduling",
        {
          params,
          headers: {
            Authorization: `${process.env.SECRET_TOKEN}`,
          },
        }
      );

      if (!responseFiltered.data) {
        return;
      }

      const data = responseFiltered.data?.data[0];

      const clientMessages = createClientMessage(data);
      const professionalMessages = createProfessionalMessage(data);

      const clientFormattedPhone = data?.telefoneCliente;
      const professionalFormattedPhone = data?.telefoneProfissional;

      switch (message.body.toString()) {
        case "0": {
          await WhatsappBotController.sendMessage(
            client,
            professionalFormattedPhone,
            professionalMessages["0"]
          );
          return;
        }
        case "1": {
          const params = {
            id: data.id,
            agendado: true,
          };

          await localInstance.post(
            "/api/schedulings/updateSchedulingStatus",
            {},
            {
              params: params,
              headers: {
                Authorization: `${process.env.SECRET_TOKEN}`,
              },
            }
          );

          await Promise.all([
            WhatsappBotController.sendMessage(
              client,
              professionalFormattedPhone,
              professionalMessages["1"]
            ),
            WhatsappBotController.sendMessage(
              client,
              clientFormattedPhone,
              clientMessages["1"]
            ),
          ]);

          return;
        }
        case "2": {
          const params = {
            id: data.id,
            agendado: true,
          };

          await localInstance.post(
            "/api/schedulings/updateSchedulingStatus",
            {},
            {
              params: params,
              headers: {
                Authorization: `${process.env.SECRET_TOKEN}`,
              },
            }
          );

          await Promise.all([
            WhatsappBotController.sendMessage(
              client,
              professionalFormattedPhone,
              professionalMessages["2"]
            ),
            WhatsappBotController.sendMessage(
              client,
              clientFormattedPhone,
              clientMessages["2"]
            ),
          ]);

          return;
        }
      }
    });
  }
}

module.exports = WhatsappBotController;
