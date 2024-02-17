const { validationResult } = require("express-validator");
const WhatsappBotController = require("./messageController");
const phoneFormatter = require("../helpers/formatPhoneNumber");
const prisma = require("../config/mongoDb");
const logger = require("../config/logger");

class DatabaseController {
  static async criarAgendamento(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        logger.error(errors);

        res.status(422).json({
          success: false,
          message: errors.mapped(),
        });
      }

      const status = req.body?.status;

      if (
        status === "APROVADO" ||
        status === "CANCELADO" ||
        status === "REAGENDADO"
      ) {
        if (WhatsappBotController.statusSender({ ...req.body, status })) {
          const msg = `Status webhook sended: ${status}`;

          logger.info(msg);

          res.status(200).json({
            success: true,
            message: msg,
          });

          return;
        }
      } else {
        const {
          nomeCliente,
          nomeProfissional,
          telefoneCliente,
          telefoneProfissional,
          telefoneClinica,
          tipoConsulta,
          dataAgendamento,
        } = req.body;

        const dateFormatted = new Date(dataAgendamento).toISOString();
        const clientPhoneFormatted = phoneFormatter(
          telefoneCliente.replace(/\+/g, "")
        );
        const professionalPhoneFormatted = phoneFormatter(
          telefoneProfissional.replace(/\+/g, "")
        );

        const clinicaPhoneFormatted = phoneFormatter(
          telefoneClinica.replace(/\+/g, "")
        );

        const scheduling = await prisma.agendamento.create({
          data: {
            nomeCliente: nomeCliente,
            nomeProfissional: nomeProfissional,
            telefoneCliente: clientPhoneFormatted,
            telefoneProfissional: professionalPhoneFormatted,
            telefoneClinica: clinicaPhoneFormatted,
            tipoConsulta: tipoConsulta,
            dataAgendamento: dateFormatted,
            agendado: false,
          },
        });

        logger.info(scheduling);

        if (WhatsappBotController.patientSender(scheduling)) {
          res.status(201).json({
            success: true,
            data: scheduling,
          });
          return;
        }
      }
    } catch (error) {
      logger.error(error);
      res.status(400).json({
        success: false,
        message: "Não foi possível criar o agendamento!",
      });
    }
  }

  static async listarAgendamentos(req, res, next) {
    try {
      const schedulings = await prisma.agendamento.findMany({});

      if (!schedulings) {
        res.status(204).json({
          success: false,
          data: null,
        });
      }

      logger.info(schedulings);

      res.status(200).json(schedulings);
    } catch (error) {
      logger.error(error);
      res.status(400).json({
        success: false,
        message: "Não foi possível listar o agendamento!",
      });
    }
  }

  static async filtrarAgendamentos(req, res, next) {
    try {
      const schedulings = await prisma.agendamento.findMany({
        where: {
          telefoneProfissional: req.query.telefoneProfissional,
          agendado: req.query.agendado === "true" ? true : false,
        },
      });

      if (!schedulings) {
        res.status(204).json({
          success: false,
          data: null,
        });
        return;
      }

      logger.info(schedulings);

      res.status(200).json({
        success: true,
        data: schedulings,
      });
    } catch (error) {
      logger.error(error);
      res.status(400).json({
        success: false,
        message: "Não foi possível filtrar o agendamentos!",
      });
    }
  }

  static async atualizarStatusAgendamento(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(422).json({
          success: false,
          message: errors.mapped(),
        });
      }

      const scheduling = await prisma.agendamento.update({
        where: {
          id: req.query.id,
        },
        data: {
          agendado: req.query.agendado === "true" ? true : false,
        },
      });

      logger.info(scheduling);

      res.status(200).json({
        success: true,
        data: scheduling,
      });
    } catch (error) {
      logger.error(error);
      res.status(400).json({
        success: false,
        message: "Não foi possível atualizar o agendamento!",
      });
    }
  }
}

module.exports = DatabaseController;
