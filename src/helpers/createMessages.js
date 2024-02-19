const { formatDateToPTBR } = require("./formatDate");

const createClientMessage = (bodyMessage) => {
  const {
    nomeCliente,
    nomeProfissional,
    telefoneCliente,
    telefoneProfissional,
    telefoneClinica,
    tipoConsulta,
    dataAgendamento,
    status,
  } = bodyMessage;

  const messages = {
    0: `
        👋 Olá, Sr(a) ${nomeCliente}. 
        Eu sou a *Sô*, a *assistente virtual* da ${process.env.BOT_NAME}. 
        Venho comunicar que nós já recebemos a sua solicitação.
        No momento estamos aguardando a confirmação do profissional selecionado. 
        Em alguns instantes o atendimento será realizado.
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // notificação - cliente
    1: `
        ✅ Agendamento Confirmado. 
        Olá, Sr(a) ${nomeCliente}, bom te ver novamente!
        O agendamento do seu serviço marcado para o dia ${formatDateToPTBR(
          dataAgendamento
        )}h tratando de ${tipoConsulta} 
        com o profissional ${nomeProfissional} foi confirmado!
        
        Caso necessário você também poderá gerenciar seus horários e 
        agendamentos em seu perfil cadastrado em nossa plataforma!

        ${process.env.PAINEL_CONTROLE_ON_SAUDE}
        
        👋 Até mais! 
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // confirmação - cliente
    2: `
        ❌ Agendamento Cancelado.
        Olá, Sr(a) ${nomeCliente}. 
        Infelizmente o profissional ${nomeProfissional} não pode confirmar 
        o agendamento na data ${formatDateToPTBR(
          dataAgendamento
        )}h tratando de ${tipoConsulta}  
        por algum motivo. Você pode escolher uma nova data dentro do seu perfil
        cadastrado na nossa plataforma através do link a seguir: 
        
        ${process.env.CLIENT_PAINEL_ON_SAUDE}

        Você também pode entrar em contato diretamente com a clínica através do número a seguir

        Telefone da clínica: ${telefoneClinica.replace(/@.*$/, "")}  

        👋 Até mais! 
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // cancelamento - cliente
    4: `
        O profissional ${nomeProfissional} ❌ cancelou o agendamento do cliente ${nomeCliente}
        📞 Telefone do cliente: ${telefoneCliente}
        📞 Telefone do profissional: ${telefoneProfissional}
        )}
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // suporte
    5: `
        Olá!

        Gostaríamos de informar que houve uma alteração no seu agendamento
        ${tipoConsulta} com o profissional ${nomeProfissional}.

        Seu novo status é ${status}

        Por favor, revise suas informações de agendamento. Se houver alguma dúvida
        ou necessidade de reagendamento, você pode realizar todo o gerenciamento através
        da sua área do cliente entrando com seu login e senha. Você também pode entrar em 
        contato diretamente com o profissional através do telefone ${telefoneProfissional.replace(/@.*$/, "")}

        Atenciosamente, equipe ON Saúde
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // webhook de status - cliente
  };

  return messages;
};

const createProfessionalMessage = (bodyMessage) => {
  const { nomeProfissional, telefoneCliente, dataAgendamento } = bodyMessage;

  const messages = {
    0: `
        👋 Olá, Sr(a) ${nomeProfissional}, você acabou de receber um novo agendamento!
        ---------------------------------------------
        📅 Data do agendamento: ${formatDateToPTBR(dataAgendamento)}h
        ---------------------------------------------
        Você confirma a realização do agendamento?
        1️⃣ - Confirmar Agendamento
        2️⃣ - Rejeitar Agendamento
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // menu de agendamentos - profissional
    1: `
        ✅ Certo, o agendamento foi confirmado!
        Estamos coletando informações com seu cliente.
        Caso precise combinar os detalhes do serviço com seu cliente:
        📞 Telefone do cliente: ${telefoneCliente.replace(/@.*$/, "")}

        Para ver novos agendamentos
        0️⃣ - Ver novos agendamentos
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // confirmado - profissional
    2: `
        ❌ Certo, o agendamento foi cancelado!
        Iremos informar o seu cliente.
        Caso precise entrar em contato diretamente seu cliente:
        📞 Telefone do cliente: ${telefoneCliente.replace(/@.*$/, "")}

        Para ver novos agendamentos
        0️⃣ - Ver novos agendamentos
        `
      .split("\n")
      .map((line) => line.trim())
      .join("\n"), // rejeitado - profissional
  };

  return messages;
};

module.exports = { createClientMessage, createProfessionalMessage };
