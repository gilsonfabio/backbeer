const { Console } = require('console');
const connection = require('../database/connection');
const moment = require('moment/moment');

module.exports = {   
    async index (request, response) {
        const consumos = await connection('consumos')
        .orderBy('conId')
        .select('*');
    
        return response.json(consumos);
    },    
        
    async create(request, response) {
        const {conUsrId, conPrdId, conPrdQtd, conPrdVlr, sldDisponivel} = request.body;

        let datAtual = new Date();
        let year = datAtual.getFullYear();
        let month = datAtual.getMonth();
        let day = datAtual.getDate();
   
        let datProcess = new Date(year,month,day);
        let horProcess = moment().format('hh:mm:ss'); 
        let status = "A";

        const [conId] = await connection('consumos').insert({
            conData: datProcess,
            conHora: horProcess,
            conUsrId, 
            conPrdId, 
            conPrdQtd, 
            conPrdVlr,
            conStatus: status, 
        });
        
        let newSaldo = Number(sldDisponivel) - Number(conPrdVlr);

        const updSld = await connection('usuarios').where('usrId', conUsrId)   
        .update({
            usrSldDisponivel: newSaldo                  
        });


        return response.json({conId});
    },    
};
