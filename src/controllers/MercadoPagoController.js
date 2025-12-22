const mercadopago = require('mercadopago');
const db = require('../database/connection');

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

module.exports = { 
  async authorize(req, res) {
    try {
      const { creId, creUsrId } = req.body;

      if (!creId || !creUsrId) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const creditos = await db('creditos')
        .where('creId', creId)
        .where('creUsrId', creUsrId)
        .select('creId', 'creValor', 'creStatus');

      if (!creditos.length) {
        return res.status(404).json({ error: 'Crédito não encontrado' });
      }

      const credito = creditos[0];

      if (credito.creStatus === 'paid') {
        return res.status(400).json({ error: 'Crédito já pago' });
      }

      if (credito.creStatus === 'pending') {
        return res.json({
          creId: credito.creId,
          status: 'pending',
          message: 'PIX já gerado, aguardando pagamento',
        });
      }

      const pagamento = await mercadopago.payment.create({
        transaction_amount: Number(credito.creValor),
        description: 'Recarga de créditos',
        payment_method_id: 'pix',
        external_reference: String(credito.creId),
        payer: {
          email: `user_${creUsrId}@app.com`,
        },
      });

      const transaction =
        pagamento.response.point_of_interaction.transaction_data;

      await db('creditos')
        .where('creId', credito.creId)
        .update({ creStatus: 'pending' });

      return res.json({
        paymentId: pagamento.response.id,
        creId: credito.creId,
        valor: credito.creValor,
        status: pagamento.response.status,
        qrcode: transaction.qr_code,
        imagemQrcode: transaction.qr_code_base64,
        expiresAt: transaction.expiration_date,
      });

    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
      return res.status(500).json({ error: 'Erro ao gerar PIX' });
    }
  },
  
  async webhook(req, res) {
    try {
      const { type, data } = req.body;
  
      // 🔒 Ignora eventos que não são pagamento
      if (type !== 'payment' || !data?.id) {
        return res.sendStatus(200);
      }
  
      const paymentId = data.id;
  
      const payment = await mercadopago.payment.get(paymentId);
      const response = payment?.response;
  
      if (!response) {
        console.warn('Webhook sem response:', paymentId);
        return res.sendStatus(200);
      }
  
      const status = response.status;
      const creId = response.external_reference;
  
      if (!creId || !status) {
        console.warn('Webhook incompleto:', response);
        return res.sendStatus(200);
      }
  
      const rows = await db('creditos')
        .where('creId', creId)
        .select('creStatus', 'creUsrId', 'creValor');
  
      if (!rows.length) {
        console.warn('Crédito não encontrado:', creId);
        return res.sendStatus(200);
      }
  
      if (rows[0].creStatus === 'paid') {
        return res.sendStatus(200);
      }
  
      if (status === 'approved') {
        await db('creditos')
          .where('creId', creId)
          .update({ creStatus: 'paid' });

        await db('usuarios')
          .where('usrId', rows[0].creUsrId)
          .increment('usrSldDisponivel', rows[0].creValor);
      }
  
      if (status === 'cancelled' || status === 'expired') {
        await db('creditos')
          .where('creId', creId)
          .update({ creStatus: status });
      }
  
      return res.sendStatus(200);
  
    } catch (error) {
      console.error('❌ Erro webhook Mercado Pago:', error);
  
      // ⚠️ SEMPRE 200
      return res.sendStatus(200);
    }
  },
  
}  



