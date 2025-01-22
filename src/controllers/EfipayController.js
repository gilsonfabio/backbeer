const moment = require('moment/moment');
const connection = require('../database/connection');
require('dotenv/config');
const EfiPay = require('sdk-node-apis-efi')
const options = require('../../credentials')

module.exports = {       
	
	async auth (request, response) {
		
		//console.log(request.body);

        const id = request.body.creUsrId; 

        const idCre = request.body.creId; 
        const creValor = request.body.creValor.replace("," , ".");
        //console.log('Valor Original:', request.body.creValor);
        let valor_cre = parseFloat(creValor).toFixed(2);
        //console.log('Valor Crédito:',valor_cre);       
        let vlrCredito = valor_cre.toString().replace("," , ".");
        //console.log('Valor Aposta:',vlrCredito);
		let vlr_cre = vlrCredito;
        
        const usuario = await connection('usuarios')
        .where('usrId', id)
        .select('usrNome', 'usrCpf', 'usrSldDisponivel');    
        
        let cpf_cli = usuario[0].usrCpf;
        let nome_cli = usuario[0].usrNome;

        let credAtual = 0.00;
        credAtual = Number(usuario[0].usrSldDisponivel).toFixed(2) + Number(creValor).toFixed(2);
               
		//console.log('Valor:',vlr_cli);
        //console.log('Usuario:',nome_cli);
        //console.log('Cpf Usuario:',cpf_cli);
		
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
	    chave: 'gilsonfabio@innvento.com.br', // Informe sua chave Pix cadastrada na efipay.	//o campo abaixo é opcional
	        infoAdicionais: [
		        {
			        nome: 'Pagamento em',
			        valor: 'BEERTECH CHOPP',
		        },
		        {
			        nome: 'Pedido',
			        valor: idCre.toString(),
		        },
	        ],
        }

        //let params = {
	    //    txid: 'dt9BHlyzrb5jrFNAdfEDVpHgiOmDbVq111',
        //}

        const efipay = new EfiPay(options);
        
        const res = await efipay.pixCreateImmediateCharge([], body);

        //console.log(res)
        //return response.json(res);

        let txid = res.txid;
        
        let datAtual = new Date();
        let year = datAtual.getFullYear();
        let month = datAtual.getMonth();
        let day = datAtual.getDate();
   
        let datProcess = new Date(year,month,day);
        let horProcess = moment().format('hh:mm:ss');        
        

        const cred = await connection('creditos')
        .where('creId', id)
        .select('creditos.*');

        valor = cred[0].creValor;
        idUsr = cred[0].creUsrId;

        let status = 'P';

        const credito = await connection('creditos').where('creId', idCre)
        .update({
            creTxaid: txid           
        });

        const saldo = await connection('usuarios').where('usrId', idUsr)
        .update({
            usrSldDisponivel: credAtual        
        });

        let paramsQRCode = {
            id: res.loc.id
        }
        efipay.pixGenerateQRCode(paramsQRCode)
	    .then((resposta) => {
		    //console.log(resposta)
            const dados = resposta;
            return response.json(dados);
	    })
	    .catch((error) => {
		    //console.log(error)
            return response.json(error);
	    })               

        //*********const res = await efipay.pixCreateImmediateCharge([], body);      //....informar no lugar do [] -> params
        //*********console.log(response);
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