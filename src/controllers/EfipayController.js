const moment = require('moment/moment');
const connection = require('../database/connection');
require('dotenv/config');
const EfiPay = require('sdk-node-apis-efi')
const options = require('../../credentials')

module.exports = {       
	
    async auth(request, response) {
        try {
            //console.log(request.body);
    
            const id = request.body.creUsrId;
            const idCre = request.body.creId;
            let nroPed = String(idCre);
            //console.log('Nro do Pedido:', nroPed);
            const creValor = request.body.creValor.replace(",", ".");
            //console.log('Valor Original:', request.body.creValor);
            let valor_cre = parseFloat(creValor).toFixed(2);
            //console.log('Valor Crédito:', valor_cre);
            let vlr_cre = valor_cre.toString().replace(",", ".");
    
            const usuario = await connection('usuarios')
                .where('usrId', id)
                .select('usrNome', 'usrCpf', 'usrSldDisponivel');
    
            if (usuario.length === 0) {
                return response.status(404).json({ error: 'Usuário não encontrado' });
            }
    
            let cpf_cli = usuario[0].usrCpf;
            let nome_cli = usuario[0].usrNome;
    
            let credAtual = (
                parseFloat(usuario[0].usrSldDisponivel) + parseFloat(creValor)
            ).toFixed(2);
    
            //console.log('Valor:', vlr_cre);
            //console.log('Usuario:', nome_cli);
            //console.log('Cpf Usuario:', cpf_cli);
    
            let body = {
                calendario: {
                    expiracao: 3600,
                },
                devedor: {
                    cpf: cpf_cli,
                    nome: nome_cli,
                },
                valor: {
                    original: vlr_cre,
                },
                chave: 'gilsonfabio@innvento.com.br',
                infoAdicionais: [
                    {
                        nome: 'Pagamento em',
                        valor: 'BEERTECH CHOPP',
                    },
                    {
                        nome: 'Pedido',
                        valor: nroPed,
                    },
                ],
            };
    
            //console.log(body);

            const efipay = new EfiPay(options);
    
            const res = await efipay.pixCreateImmediateCharge([], body);
            const txid = res.txid;
    
            const cred = await connection('creditos')
                .where('creId', idCre)
                .select('creditos.*');
    
            if (cred.length === 0) {
                return response.status(404).json({ error: 'Crédito não encontrado' });
            }
    
            const idUsr = cred[0].creUsrId;
    
            await connection('creditos').where('creId', idCre).update({
                creTxaid: txid,
            });
    
            await connection('usuarios').where('usrId', idUsr).update({
                usrSldDisponivel: credAtual,
            });
    
            const paramsQRCode = {
                id: res.loc.id,
            };
    
            const resposta = await efipay.pixGenerateQRCode(paramsQRCode);
    
            return response.json(resposta);
    
        } catch (error) {
            console.error('Erro na geração do Pix:', error);
            return response.status(500).json({ error: 'Erro ao gerar cobrança Pix', details: error });
        }
    },    

	async webhook (request, response) {
        
        //if(request.user == null) {
        //    return response.status(400).json({ error: 'Invalid User!'});
        //}

        //if(request.user.usrToken != 'adf7eabd-7cd5-4f63-a2f6-004f1a7d') throw 'Invalid User!';

		const txid = request.body.txid;
        let status = 'E';
        const updCred = await connection('creditos')
        .where('creTxaId', txid)
        .update({
            lanStatus: status, 
        });

        const regLanc = await connection('creditos')
        .where('creTxaId', txid)
        .select('*');
                            
        return response.json({result: 'Pix recebido com sucesso!'});
		
    },

    async certificado (request, response) {
        //const fs = require('fs')
        //const path = require('path')

        //const cert = fs.readFileSync('C:/users/gilsonfabio/estudo/backbet/src/certs/homologacao-499441-NextBet.p12', 'base64');	    

        //console.log(cert);
        //return response.json(cert);
    }

};