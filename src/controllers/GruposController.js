const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const grupos = await connection('grupos')
        .orderBy('grpId')
        .select('*');
    
        //console.log(grupos);
        
        return response.json(grupos);
    },    
        
    async create(request, response) {
        const {grpDescricao} = request.body;
        const [grpId] = await connection('grupos').insert({
            grpDescricao, 
        });
           
        return response.json({grpId});
    },    
};
