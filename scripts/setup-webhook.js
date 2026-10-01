// Script temporal para configurar webhook via API
// Ejecutar: node scripts/setup-webhook.js

const axios = require('axios');

const ACCESS_TOKEN = 'APP_USR-2419304267002687-092516-9c9677de774538b954d6e394e1f80167-3717839604';
const WEBHOOK_URL = 'https://kilometer-escapist-barber.ngrok-free.dev/api/webhooks/mercadopago';

async function setupWebhook() {
  try {
    const response = await axios.post(
      'https://api.mercadopago.com/v1/notifications/webhooks',
      {
        url: WEBHOOK_URL,
        application_id: '5372293928558550',
        events: ['payment'],
        status: 'active'
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Webhook creado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error al crear webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

setupWebhook();
