const mercadopago = require('mercadopago');
const db = require('../database/connection');

// Configuração do Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

async function authorize(req, res) {
  try {
    const { creUsrId, creId, creValor } = req.body;

    // 🔐 Validações básicas
    if (!creUsrId || !creId || !creValor) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Evita duplicar PIX para o mesmo crédito
    const [existe] = await db.query(
      'SELECT id FROM pix_pagamentos WHERE cre_id = ? AND status = "pending"',
      [creId]
    );

    if (existe.length) {
      return res.status(200).json(existe[0]);
    }

    // 💳 Cria pagamento PIX no Mercado Pago
    const pagamento = await mercadopago.payment.create({
      transaction_amount: Number(creValor),
      description: 'Recarga de crédito',
      payment_method_id: 'pix',
      external_reference: String(creId), // 🔑 ligação com crédito
      payer: {
        email: `user_${creUsrId}@app.com`,
      },
    });

    const pix =
      pagamento.response.point_of_interaction.transaction_data;

    // 💾 Salva pagamento no banco
    //await db.query(
    //  `INSERT INTO pix_pagamentos 
    //   (payment_id, cre_id, user_id, valor, status) 
    //   VALUES (?, ?, ?, ?, ?)`,
    //  [
    //    pagamento.response.id,
    //    creId,
    //    creUsrId,
    //    creValor,
    //    pagamento.response.status,
    //  ]
    //);

    // 📤 Retorno para o frontend
    return res.json({
      paymentId: pagamento.response.id,
      imagemQrcode: pix.qr_code_base64,
      qrcode: pix.qr_code,
      status: pagamento.response.status,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    return res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
}

module.exports = { authorize };
