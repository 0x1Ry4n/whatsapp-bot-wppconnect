const { tipoConsultaDefault, tipoProcedimentoDefault, tipoConvenioDefault, localAgendaDefault, dataValidadeDefault } = require("./constants/constants");
const { validationResult } = require("express-validator");
const { consultorioInstance, localInstance } = require("../config/axiosInstance");
const logger = require("../config/logger");

class ConsultorioController {
    static async criarAgenda({ data, idPaciente, headers, auth }) {
        const {
            nomeCliente,
            nomeProfissional,
            telefoneCliente,
            telefoneProfissional,
            tipoConsulta,
            dataAgendamentoInicio,
            emailCliente,
            dataAgendamentoFim,
            status
        } = data;

        try {
            const dataAgendamentoInicioFormatado = new Date(dataAgendamentoInicio.toLocaleString('pt-BR'));
            const dataAgendamentoFimFormatado = new Date(dataAgendamentoFim.toLocaleString('pt-BR'));

            const associacaoPaciente = await ConsultorioController.associarPacienteConvenio({ data: { tipoConvenioDefault, idPaciente }, headers: headers, auth: auth });

            const mes = dataAgendamentoInicioFormatado.getMonth() + 1
            let mesFormatado = mes.toString()
            mesFormatado = mesFormatado.length === 1 ? "0" + mesFormatado : mesFormatado;

            const response = await consultorioInstance.post("/agenda/novo", {
                idPaciente: idPaciente,
                emailPaciente: emailCliente,
                telefoneCelularPaciente: telefoneCliente,
                data: `${dataAgendamentoInicioFormatado.getFullYear()}-${mesFormatado}-${dataAgendamentoInicioFormatado.getDate()}`,
                horaInicio: `${dataAgendamentoInicioFormatado.getHours()}:${dataAgendamentoInicioFormatado.getMinutes()}:00`,
                horaFim: `${dataAgendamentoFimFormatado.getHours()}:${dataAgendamentoFimFormatado.getMinutes()}:00`,
                idTipoConsulta: tipoConsultaDefault,
                idLocalAgenda: localAgendaDefault,
                idPacienteConvenio: associacaoPaciente.id,
                procedimentos: [
                    {
                        idTipoProcedimento: tipoProcedimentoDefault,
                        quantidade: 1
                    }
                ],
                status: status
            }, {
                headers,
                auth
            })


            const data = {
                nomeCliente,
                nomeProfissional,
                telefoneCliente,
                telefoneProfissional,
                tipoConsulta,
                dataAgendamentoInicio
            }

            await ConsultorioController.criarNotificacaoWhatsapp({
                data: data
            })

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    static async criarPaciente({ data, headers, auth }) {
        const {
            nomeCliente,
            cpfCliente,
            dataNascimento,
            telefoneCliente,
            emailCliente
        } = data;

        try {
            const response = await consultorioInstance.post("/paciente/novo", {
                nome: nomeCliente,
                cpfcnpj: cpfCliente,
                dataNascimento,
                sexo: "M",
                contato: {
                    email: emailCliente,
                    telefoneCelular: telefoneCliente
                },
                endereco: {
                    bairro: "",
                    cep: "",
                    complemento: "",
                    idCidade: 1,
                    numero: "",
                    rua: ""
                },
                estrangeiro: false
            }, {
                headers,
                auth
            });

            logger.info(response)

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    static async associarPacienteConvenio({ data, headers, auth }) {
        const { tipoConvenioDefault, idPaciente } = data;

        try {
            const response = await consultorioInstance.get("/convenio-paciente/lista", {
                headers,
                auth,
                params: { idPaciente }
            });

            if (response.data.lista && response.data.lista.length > 0) {
                return response.data.lista[0];
            }

            const associar = await consultorioInstance.post("/convenio-paciente/associar", {
                idPaciente,
                idTipoConvenio: tipoConvenioDefault,
                dataValidade: dataValidadeDefault
            }, {
                headers,
                auth
            });

            return associar.data;
        } catch (error) {
            throw error;
        }
    };

    static async criarNotificacaoWhatsapp({ data }) {
        try {
            const {
                nomeCliente,
                nomeProfissional,
                telefoneCliente,
                telefoneProfissional,
                tipoConsulta,
                dataAgendamentoInicio
            } = data;


            const headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "Authorization": process.env.SECRET_TOKEN
            };

            const response = await localInstance.post("/api/schedulings/createScheduling", {
                nomeCliente,
                nomeProfissional,
                telefoneCliente,
                telefoneProfissional,
                tipoConsulta,
                dataAgendamento: dataAgendamentoInicio
            }, {
                headers
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    };

    static async criarAgendamento(req, res, next) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                logger.error(errors);
                return res.status(422).json({
                    message: errors.array()
                });
            }

            const { clientid, clientsecret, clinicanasnuvenscid } = req.headers;

            const headers = {
                'clinicaNasNuvens-cid': clinicanasnuvenscid
            };

            const auth = {
                username: clientid,
                password: clientsecret
            };

            const params = {
                cpfCnpj: req.body.cpfCliente
            };

            const responseLista = await consultorioInstance.get("/paciente/lista", {
                params,
                headers,
                auth
            });

            if (responseLista.data.lista && responseLista.data.lista.length > 0) {
                const obj = responseLista.data.lista[0];
                const agenda = await ConsultorioController.criarAgenda({ data: req.body, idPaciente: obj.id, headers, auth });
                console.log(agenda)
                res.status(200).json({
                    message: "Agenda criada. Notificação de WhatsApp enviada!"
                });
            } else {
                const obj = await ConsultorioController.criarPaciente({ data: req.body, headers, auth });
                const agenda = await ConsultorioController.criarAgenda({ data: req.body, idPaciente: obj.id, headers, auth });
                console.log(agenda);
                res.status(200).json({
                    message: "Paciente e agenda criados. Notificação de WhatsApp enviada!"
                });
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: "Erro ao criar o paciente ou a agenda",
                error: error?.response.data || ""
            });
        }
    }
}

module.exports = ConsultorioController;
