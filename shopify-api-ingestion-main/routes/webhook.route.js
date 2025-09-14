import express from 'express';
import WebhookController from '../webhooks/webhook.controller.js';

const router = express.Router();

// Shopify webhooks
router.post('/products/update', 
  WebhookController.verifyShopifyWebhook, 
  WebhookController.handleProductUpdate
);

router.post('/customers/update', 
  WebhookController.verifyShopifyWebhook, 
  WebhookController.handleCustomerUpdate
);

router.post('/orders/paid', 
  WebhookController.verifyShopifyWebhook, 
  WebhookController.handleOrderUpdate
);

router.post('/carts/abandon', 
  WebhookController.verifyShopifyWebhook, 
  WebhookController.handleCartAbandoned
);

router.post('/checkouts/create', 
  WebhookController.verifyShopifyWebhook, 
  WebhookController.handleCheckoutStarted
);

export default router;