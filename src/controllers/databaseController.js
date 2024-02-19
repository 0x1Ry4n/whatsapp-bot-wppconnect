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

        return res.status(422).json({
          success: false,
          message: errors.mapped(),
        });
      }

      const {
        nomeCliente,
        nomeProfissional,
        telefoneCliente,
        telefoneProfissional,
        telefoneClinica,
        tipoConsulta,
        dataAgendamento,
      } = req.body;

      const clientPhoneFormatted = phoneFormatter(telefoneCliente.replace(/\+/g, ""));
      const professionalPhoneFormatted = phoneFormatter(telefoneProfissional.replace(/\+/g, ""));
      const clinicaPhoneFormatted = phoneFormatter(telefoneClinica.replace(/\+/g, ""));
      const dateFormatted = new Date(dataAgendamento).toISOString();
      const status = req.body?.status;

      if (status) {
        if (
          WhatsappBotController.statusSender({ 
            nomeCliente, 
            nomeProfissional, 
            telefoneProfissional: professionalPhoneFormatted, 
            telefoneCliente: clientPhoneFormatted, 
            telefoneClinica: clinicaPhoneFormatted,
            tipoConsulta, 
            dataAgendamento, 
            status 
          })
        ) {
          const msg = `Status webhook sended: ${status}`;

          logger.info(msg);

          return res.status(200).json({
            success: true,
            message: msg,
          });
        }
      } 
    
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
        return res.status(200).json({
          success: true,
          data: scheduling,
        });
      }
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: error,
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
      res.status(500).json({
        success: false,
        message: error,
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
        return res.status(204).json({
          success: false,
          data: null,
        });
      }

      logger.info(schedulings);

      return res.status(200).json({
        success: true,
        data: schedulings,
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: error
      });
    }
  }

  static async atualizarStatusAgendamento(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({
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

      return res.status(200).json({
        success: true,
        data: scheduling,
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  }
}

module.exports = DatabaseController;
