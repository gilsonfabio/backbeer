const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        const products = await connection('produtos')
        .orderBy('proDescricao')
        .select('*');
    
        return response.json(products);
    },    
        
    async create(request, response) {
        const {proDescricao, 
            proReferencia, 
            proSegmento, 
            proMarca, 
            proGrupo, 
            proLinha, 
            proCodBarra, 
            proUnidade, 
            proCodNcm, 
            proUltCusto, 
            proQtdPeq,
            proPreVdaPeq,
            proTmpPeq,
            proQtdMed, 
            proPreVdaMed,
            proTmpMed,
            proQtdGrd, 
            proPreVdaGrd,
            proTmpGrd, 
            proTributacao, 
            proCodCst, 
            proAvatar} = request.body;

        let status = 'A'; 
        const [idProd] = await connection('produtos').insert({
            proDescricao, 
            proReferencia, 
            proSegmento, 
            proMarca, 
            proGrupo, 
            proLinha, 
            proCodBarra, 
            proUnidade, 
            proCodNcm, 
            proUltCusto,
            proQtdPeq, 
            proPreVdaPeq,
            proTmpPeq,
            proQtdMed,
            proPreVdaMed,
            proTmpMed,
            proQtdGrd, 
            proPreVdaGrd,
            proTmpGrd, 
            proTributacao, 
            proCodCst, 
            proStatus: status, 
            proAvatar
        });
           
        return response.json({idProd});
    },

    async detProduct(request, response) {
        let id = request.params.proId;
        const product = await connection('produtos')
            .where('idProd', id)
            .select('*')
            .first();
          
        if (!product) {
            return response.status(400).json({ error: 'Produto nao encontrado'});
        } 

        //console.log(product);

        return response.json(product);
    },

    async searchPro(request, response) {
        let id = request.params.idPro;

        console.log('Procurando produto com o Id:',id);

        const produto = await connection('produtos')
            .where('idProd', id)
            .select('*')
            .first();
          
        if (!produto) {
            return response.status(400).json({ error: 'Não encontrou produto c/ este ID'});
        } 

        return response.json(produto);
    },
    
    async lnhProdutos(request, response) {
        let id = request.params.idLnh;

        console.log('Procurando produtos da linha Id:',id);

        const produtos = await connection('produtos')
            .where('proLinha', id)
            .select('*');
          
        if (!produtos) {
            return response.status(400).json({ error: 'Não encontrou produto c/ este ID'});
        } 

        return response.json(produtos);
    },
};
