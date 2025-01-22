const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {

        let id = request.params.idGrp;

        const linhas = await connection('linhas')
        .where('lnhGrpId', id)
        .orderBy('lnhId')
        .select('*');
    
        return response.json(linhas);
    },    
        
    async create(request, response) {
        const {lnhDescricao} = request.body;
        const [lnhId] = await connection('linhas').insert({
            lnhDescricao, 
        });
           
        return response.json({lnhId});
    },
};
