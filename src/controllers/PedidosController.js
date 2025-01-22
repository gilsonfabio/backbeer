const { Console } = require('console');
const connection = require('../database/connection');

module.exports = {   
    async index (request, response) {
        let status = 1;
        const pedidos = await connection('pedidos')
        .where('pedStatus', status)
        .join('usuarios', 'usrId', 'pedidos.pedUsrId')
        .select(['pedidos.*', 'usuarios.usrNome', 'usuarios.usrCelular']);
        
        return response.json(pedidos);
    },

    async searchPed (request, response) {
        let id = request.params.idPed
        const pedido = await connection('pedidos')
        .where('pedId', id)
        .join('usuarios', 'usrId', 'pedidos.pedUsrId')
        .select(['pedidos.*', 'usuarios.*']);
        
        return response.json(pedido);
    },

    async carcompras(request, response) {
        const { pedData, pedCliId, pedQtdTotal, pedVlrTotal, pedCupom, pedVlrPagar, pedEndEntrega,
             pedVlrTaxEntrega, pedFrmPagto, itePedProId, itePedQtde, itePedVlrUnit} = request.body;
        let id = request.body.pedCliId;
        let status = 1;
        let iteVlrTotal = itePedQtde * itePedVlrUnit;
        let iteNro = 1;
        
        const [pedId] = await connection('pedidos').insert({
            pedData, 
            pedUsrId, 
            pedQtdTotal, 
            pedVlrTotal, 
            pedCupom, 
            pedVlrPagar,                 
            pedEndEntrega,
            pedVlrTaxEntrega, 
            pedFrmPagto,
            pedStatus: status,
            pedUltItem: iteNro 
        });
       
        return response.json(car);
    },
       
    async cnfPedido(request, response) {
        let id = request.body.idPed;
        let txid = request.body.pedTxid;
        let status = 2;

        console.log('confirmando pedido nr.', id)

        const pedido = await connection('pedidos').where('pedId', id)
        .update({
            pedStatus: status, 
            pedTxid: txid           
        });
       
        return response.json(pedido);
    },
};
