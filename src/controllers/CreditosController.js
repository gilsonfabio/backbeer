const moment = require('moment/moment');
const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const creditos = await connection('creditos')
        .orderBy('creId')
        .select('*');
    
        //console.log(grupos);
        
        return response.json(creditos);
    },    
        
    async create(request, response) {
        const {creUsrId, creValor} = request.body;

        let datAtual = new Date();
        let year = datAtual.getFullYear();
        let month = datAtual.getMonth();
        let day = datAtual.getDate();
   
        let datProcess = new Date(year,month,day);
        let horProcess = moment().format('hh:mm:ss'); 

        let taxa = "";
        let status = "A";

        const [creId] = await connection('creditos').insert({
            creData: datProcess, 
            creHora: horProcess, 
            creUsrId, 
            creValor, 
            creTxaId: taxa, 
            creStatus: status, 
        });
           
        return response.json({creId});
    },  

    async cnfRecarga(request, response) {
        let id = request.body.creId;
        let status = E;

        console.log('confirmando recarga nr.', id)

        const recarga = await connection('creditos').where('creId', id)
        .update({
            creStatus: status, 
        });
       
        return response.json(creditos);
    },

    async searchSaldo(request, response) {
        let idUsr = request.params.id;
        console.log(idUsr)
        const saldo = await connection('usuarios').where('usrId', idUsr)
        .select('usrId','usrNome', 'usrSldDisponivel' );
       
        console.log(saldo)
        return response.json(saldo);
    },
    
};


//   `creId`, `creData`, `creHora`, `creUsrId`, `creValor`, `creTxaId`, `creStatus`
