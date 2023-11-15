const { formatDateToPTBR } = require("./formatDate");

const createClientMessage = (body) => {
    const messages = {
        "0": `
        👋 Olá, Sr(a) ${body.nomeCliente}. 
        Eu sou a *Sô*, a *assistente virtual* da ${process.env.BOT_NAME}. 
        Venho comunicar que nós já recebemos a sua solicitação.
        No momento estamos aguardando a confirmação do profissional selecionado. 
        Em alguns instantes o atendimento será realizado.
        `.split('\n').map(line => line.trim()).join('\n'),
        "1": `
        👋 Olá, Sr(a) ${body.nomeCliente}, bom te ver novamente!
        O agendamento do seu serviço marcado para o dia ${formatDateToPTBR(body.dataAgendamento)}h tratando de ${body.tipoConsulta} 
        com o profissional ${body.nomeProfissional} foi confirmado! ✅.
        `.split('\n').map(line => line.trim()).join('\n'),
        "2": `
        👋 Olá, Sr(a) ${body.nomeCliente}, bom te ver novamente! 
        O agendamento do seu serviço marcado para o 
        dia ${formatDateToPTBR(body.dataAgendamento)}h tratando de ${body.tipoConsulta} 
        com o profissional ${body.nomeProfissional} foi cancelado! ❌.
        `.split('\n').map(line => line.trim()).join('\n'),
        "3": `
        Verifique seu e-mail cadastrado para conferir se o profissional disponibilizou algum documento 
        a ser preenchido previamente à data do seu agendamento!
        Caso precise conversar com o profissional:
        ➡️ Telefone do profissional: ${body.telefoneProfissional.replace(/@c\.us/g, "")}
        `.split('\n').map(line => line.trim()).join('\n'),
        "4": `
        O profissional ${body.nomeProfissional} ❌ cancelou o agendamento do cliente ${body.nomeCliente}
        ➡️ Telefone do cliente: ${body.telefoneCliente.replace(/@c\.us/g, "")}
        ➡️ Telefone do profissional: ${body.telefoneProfissional.replace(/@c\.us/g, "")}
        `.split('\n').map(line => line.trim()).join('\n'),

    }

    return messages;
}

const createProfessionalMessage = (body) => {
    const messages = {
        "0": `
        👋 Olá, Sr(a) ${body.nomeProfissional}, você acabou de receber um novo agendamento!
        ---------------------------------------------
        📅 Data do agendamento: ${formatDateToPTBR(body.dataAgendamento)}h
        ---------------------------------------------
        Você confirma a realização do agendamento?
        1️⃣ - Confirmar Agendamento
        2️⃣ - Rejeitar Agendamento
        `.split('\n').map(line => line.trim()).join('\n'),
        "1": `
        Certo, o seu agendamento foi confirmado!
        Estamos coletando informações com seu paciente.
        Caso precise combinar os detalhes do serviço com seu cliente:
        ➡️ Telefone do paciente: ${body.telefoneCliente.replace(/@c\.us/g, "")}

        Para ver novos agendamentos
        0️⃣ - Ver novos agendamentos
        `.split('\n').map(line => line.trim()).join('\n')
    }

    return messages;
}

module.exports = { createClientMessage, createProfessionalMessage };
