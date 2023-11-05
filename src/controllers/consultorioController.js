const { tipoConsultaDefault, tipoProcedimentoDefault, tipoConvenioDefault, localAgendaDefault, dataValidadeDefault, horaFimDefault } = require("./constants/constants");
const { validatePatientScheduling } = require("../validators/schemas");
const { validationResult } = require("express-validator");
const apiRateLimit = require("../middlewares/rateLimit");
const logger = require("../config/logger");
const axios = require("axios");
const router = require("express").Router();
const serverAddress = require("../config/serverAddress");
const port = require("../config/port");

const associarPacienteConvenio = async ({ data, headers, auth }) => {
    const { tipoConvenioDefault, idPaciente } = data;

    try {
        const response = await axios.get(`${process.env.CONSULTORIO_API_ADDRESS}/convenio-paciente/lista`, {
            headers,
            auth,
            params: {
                idPaciente
            }
        });

        if (response.data.lista && response.data.lista.length > 0) {
            return response.data.lista[0];
        }

        const associar = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/convenio-paciente/associar`, {
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

const criarAgenda = async ({ data, idPaciente, headers, auth }) => {
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

        const associacaoPaciente = await associarPacienteConvenio({ data: { tipoConvenioDefault, idPaciente }, headers: headers, auth: auth });

        const mes = dataAgendamentoInicioFormatado.getMonth() + 1
        let mesFormatado = mes.toString()
        mesFormatado = mesFormatado.length === 1 ? "0" + mesFormatado : mesFormatado;

        const response = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/agenda/novo`, {
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

        await criarNotificacaoWhatsapp({
            data: data
        })

        return response.data;
    } catch (error) {
        throw error;
    }
};

const criarNotificacaoWhatsapp = async ({ data }) => {
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
            "Accept-Encoding": "gzip, deflate, br"
        };

        const response = await axios.post(`${serverAddress}:${port}/api/schedulings/createScheduling`, {
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

const criarPaciente = async ({ data, headers, auth }) => {
    const {
        nomeCliente,
        cpfCliente,
        dataNascimento,
        telefoneCliente,
        emailCliente
    } = data;

    try {
        const response = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/paciente/novo`, {
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

router.post("/createScheduling", apiRateLimit, validatePatientScheduling, async (req, res, next) => {
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

        const responseLista = await axios.get(`${process.env.CONSULTORIO_API_ADDRESS}/paciente/lista`, {
            params,
            headers,
            auth
        });

        if (responseLista.data.lista && responseLista.data.lista.length > 0) {
            const obj = responseLista.data.lista[0];
            const agenda = await criarAgenda({ data: req.body, idPaciente: obj.id, headers, auth });
            logger.info(agenda)
            res.status(200).json({ message: "Agenda criada. Notificação de WhatsApp enviada!" });
        } else {
            const obj = await criarPaciente({ data: req.body, headers, auth });
            const agenda = await criarAgenda({ data: req.body, idPaciente: obj.id, headers, auth });
            logger.info(agenda);
            res.status(200).json({ message: "Paciente e agenda criados. Notificação de WhatsApp enviada!" });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Erro ao criar o paciente ou a agenda", error: error.response?.data || error.response });
    }
});

module.exports = router;
