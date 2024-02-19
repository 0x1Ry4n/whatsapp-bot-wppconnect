const { body } = require("express-validator");

const validateScheduling = [
  body("nomeCliente").isString({ min: 2, max: 255 }).exists(),
  body("nomeProfissional").isString({ min: 2, max: 255 }).exists(),
  body("telefoneCliente").isString({ max: 16 }).exists(),
  body("telefoneProfissional").isString({ max: 16 }).exists(),
  body("telefoneClinica").isString({ max: 75 }).exists(),
  body("tipoConsulta").isString({ max: 75 }).exists(),
  body("dataAgendamento").isISO8601().exists(),
  body("status").isString().isIn(["ALTERADO", "APROVADO", "CANCELADO", "REAGENDADO"]).optional(),
];

const validateUpdateScheduling = [
  body("nomeCliente").isString({ min: 2, max: 255 }).optional(),
  body("nomeProfissional").isString({ min: 2, max: 255 }).optional(),
  body("telefoneCliente").isString({ max: 16 }).optional(),
  body("telefoneProfissional").isString({ max: 16 }).optional(),
  body("tipoConsulta").isString({ max: 75 }).optional(),
  body("dataAgendamento").isISO8601().optional(),
  body("agendado").isBoolean().optional(),
];

const validatePatientScheduling = [
  body("nomeCliente").isString({ min: 2, max: 255 }),
  body("nomeProfissional").isString({ min: 2, max: 255 }),
  body("cpfCliente").isString({ max: 12 }),
  body("telefoneCliente").isString({ min: 16 }),
  body("tipoConsulta").isString({ max: 75 }).optional(),
  body("telefoneProfissional").isString({ max: 16 }),
  body("emailCliente").isString({ max: 255 }),
  body("dataAgendamentoInicio").isString({ max: 75 }),
  body("dataAgendamentoFim").isString({ max: 75 }),
  body("dataNascimento").isString({ max: 15 }).optional(),
  body("status").isString({ max: 50 }),
];

module.exports = {
  validateScheduling,
  validateUpdateScheduling,
  validatePatientScheduling,
};
