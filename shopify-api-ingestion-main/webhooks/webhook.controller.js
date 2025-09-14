import ProductService from '../services/product.service.js';
import CustomerService from '../services/customer.service.js';
import OrderService from '../services/order.service.js';
import crypto from 'crypto';

class WebhookController {
  static verifyShopifyWebhook(req, res, next) {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    if (hash !== hmac) {
      return res.status(401).send('Unauthorized');
    }
    
    next();
  }

  static async handleProductUpdate(req, res) {
    try {
      const product = req.body;
      const tenantId = req.headers['x-tenant-id'] || 'default';
      
      console.log('Product webhook received:', product.id);
      
      // Update or create product
      await ProductService.upsertProduct(product, tenantId);
      
      res.status(200).json({ message: 'Product webhook processed successfully' });
    } catch (error) {
      console.error('Product webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handleCustomerUpdate(req, res) {
    try {
      const customer = req.body;
      const tenantId = req.headers['x-tenant-id'] || 'default';
      
      console.log('Customer webhook received:', customer.id);
      
      // Update or create customer
      await CustomerService.upsertCustomer(customer, tenantId);
      
      res.status(200).json({ message: 'Customer webhook processed successfully' });
    } catch (error) {
      console.error('Customer webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handleOrderUpdate(req, res) {
    try {
      const order = req.body;
      const tenantId = req.headers['x-tenant-id'] || 'default';
      
      console.log('Order webhook received:', order.id);
      
      // Update or create order
      await OrderService.upsertOrder(order, tenantId);
      
      res.status(200).json({ message: 'Order webhook processed successfully' });
    } catch (error) {
      console.error('Order webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handleCartAbandoned(req, res) {
    try {
      const cartData = req.body;
      const tenantId = req.headers['x-tenant-id'] || 'default';
      
      console.log('Cart abandoned webhook received:', cartData.id);
      
      // Log cart abandonment event
      await this.logCustomEvent({
        eventType: 'cart_abandoned',
        customerId: cartData.customer_id,
        data: cartData,
        tenantId
      });
      
      res.status(200).json({ message: 'Cart abandonment tracked successfully' });
    } catch (error) {
      console.error('Cart abandoned webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async handleCheckoutStarted(req, res) {
    try {
      const checkoutData = req.body;
      const tenantId = req.headers['x-tenant-id'] || 'default';
      
      console.log('Checkout started webhook received:', checkoutData.id);
      
      // Log checkout started event
      await this.logCustomEvent({
        eventType: 'checkout_started',
        customerId: checkoutData.customer_id,
        data: checkoutData,
        tenantId
      });
      
      res.status(200).json({ message: 'Checkout started tracked successfully' });
    } catch (error) {
      console.error('Checkout started webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async logCustomEvent(eventData) {
    // In a real implementation, you might store this in a separate events table
    console.log('Custom event logged:', eventData);
    
    // You could implement analytics tracking here
    // await prisma.customEvent.create({ data: eventData });
  }
}

export default WebhookController;