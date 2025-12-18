const mercadopago = require('mercadopago');
const db = require('../database/connection');

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

async function authorize(req, res) {
  try {
    const { creId, creUsrId } = req.body;

    if (!creId || !creUsrId) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const [creditos] = await db.query(
      `SELECT creId, creValor, creStatus
       FROM creditos
       WHERE creId = ? AND creUsrId = ?`,
      [creId, creUsrId]
    );

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

    await db.query(
      `UPDATE creditos
       SET creStatus = 'pending'
       WHERE creId = ?`,
      [credito.creId]
    );

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
}

async function webhook(req, res) {
  try {
    const { type, data } = req.body;

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200);
    }

    const paymentId = data.id;
    const payment = await mercadopago.payment.get(paymentId);

    const status = payment.response.status;
    const creId = payment.response.external_reference;

    if (!creId) return res.sendStatus(200);

    const [rows] = await db.query(
      `SELECT creStatus FROM creditos WHERE creId = ?`,
      [creId]
    );

    if (!rows.length) return res.sendStatus(200);
    if (rows[0].creStatus === 'paid') return res.sendStatus(200);

    if (status === 'approved') {
      await db.query(
        `UPDATE creditos SET creStatus = 'paid' WHERE creId = ?`,
        [creId]
      );
    }

    if (status === 'cancelled' || status === 'expired') {
      await db.query(
        `UPDATE creditos SET creStatus = ? WHERE creId = ?`,
        [status, creId]
      );
    }

    return res.sendStatus(200);

  } catch (error) {
    console.error('❌ Erro webhook:', error);
    return res.sendStatus(500);
  }
}

module.exports = {
  authorize,
  webhook,
};
