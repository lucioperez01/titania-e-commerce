// Script para consultar el estado del último pago
// Ejecutar: node scripts/check-last-payment.js

const axios = require('axios');

const ACCESS_TOKEN = 'APP_USR-2419304267002687-092516-9c9677de774538b954d6e394e1f80167-3717839604';

async function checkLastPayment() {
  try {
    const response = await axios.get(
      'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=5',
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    console.log('Últimos pagos:');
    const payments = response.data.results || [];
    payments.forEach(p => {
      console.log(`\nPayment ID: ${p.id}`);
      console.log(`Status: ${p.status}`);
      console.log(`Status Detail: ${p.status_detail}`);
      console.log(`External Reference: ${p.external_reference}`);
      console.log(`Transaction Amount: ${p.transaction_amount}`);
      console.log(`Date Created: ${p.date_created}`);
      console.log(`---`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkLastPayment();
