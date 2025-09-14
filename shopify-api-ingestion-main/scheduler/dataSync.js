import cron from 'node-cron';
import ProductService from '../services/product.service.js';
import CustomerService from '../services/customer.service.js';
import OrderService from '../services/order.service.js';
import prisma from '../config/db.js';

class DataSyncScheduler {
  static start() {
    // Sync data every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Starting hourly data sync...');
      await this.syncAllTenants();
    });

    // Sync data every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily full data sync...');
      await this.fullSyncAllTenants();
    });

    console.log('Data sync scheduler started');
  }

  static async syncAllTenants() {
    try {
      const tenants = await prisma.tenant.findMany();
      
      for (const tenant of tenants) {
        await this.syncTenantData(tenant, false);
      }
    } catch (error) {
      console.error('Error syncing all tenants:', error);
    }
  }

  static async fullSyncAllTenants() {
    try {
      const tenants = await prisma.tenant.findMany();
      
      for (const tenant of tenants) {
        await this.syncTenantData(tenant, true);
      }
    } catch (error) {
      console.error('Error in full sync:', error);
    }
  }

  static async syncTenantData(tenant, fullSync = false) {
    try {
      console.log(`Syncing data for tenant: ${tenant.name}`);
      
      // Set environment variables for this tenant
      const originalStore = process.env.SHOPIFY_STORE;
      const originalToken = process.env.ACCESS_TOKEN;
      
      process.env.SHOPIFY_STORE = tenant.shopifyStore;
      process.env.ACCESS_TOKEN = tenant.accessToken;

      // Sync products
      try {
        const products = await ProductService.getProducts();
        await ProductService.createProducts(products.map(p => ({ ...p, tenantId: tenant.id })));
        console.log(`Synced ${products.length} products for ${tenant.name}`);
      } catch (error) {
        console.error(`Error syncing products for ${tenant.name}:`, error.message);
      }

      // Sync customers
      try {
        const customers = await CustomerService.getCustomers();
        await CustomerService.createCustomers(customers.map(c => ({ ...c, tenantId: tenant.id })));
        console.log(`Synced ${customers.length} customers for ${tenant.name}`);
      } catch (error) {
        console.error(`Error syncing customers for ${tenant.name}:`, error.message);
      }

      // Sync orders
      try {
        const orders = await OrderService.getOrder();
        await OrderService.createOrders(orders.map(o => ({ ...o, tenantId: tenant.id })));
        console.log(`Synced ${orders.length} orders for ${tenant.name}`);
      } catch (error) {
        console.error(`Error syncing orders for ${tenant.name}:`, error.message);
      }

      // Restore original environment variables
      process.env.SHOPIFY_STORE = originalStore;
      process.env.ACCESS_TOKEN = originalToken;

      console.log(`Completed sync for tenant: ${tenant.name}`);
    } catch (error) {
      console.error(`Error syncing tenant ${tenant.name}:`, error);
    }
  }

  static async syncSpecificTenant(tenantId) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      await this.syncTenantData(tenant, true);
      return { success: true, message: `Sync completed for ${tenant.name}` };
    } catch (error) {
      console.error('Error syncing specific tenant:', error);
      return { success: false, error: error.message };
    }
  }
}

export default DataSyncScheduler;