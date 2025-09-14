import axios from "axios";
import prisma from "../config/db.js";
import CustomError from "../utils/custom_error.js";
const { SHOPIFY_STORE, ACCESS_TOKEN } = process.env;

class OrderService {
  static async getOrder() {
    try {
      const response = await axios.get(
        `https://${SHOPIFY_STORE}/admin/api/2025-07/orders.json?limit=50&status=any`,
        {
          headers: {
            "X-Shopify-Access-Token": ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new CustomError(
          `Shopify API error: ${response.statusText}`,
          response.status
        );
      }

      return response.data.orders;
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError("Failed to fetch orders from Shopify", 500);
    }
  }

  static async createOrders(orders) {
    if (!orders || orders.length === 0) {
      console.log("No orders provided to create.");
      return { createdCount: 0, message: "No orders to process." };
    }

    try {
      const incomingOrderIds = orders.map((o) => o.id);
      const existingOrders = await prisma.order.findMany({
        where: { id: { in: incomingOrderIds } },
        select: { id: true },
      });
      const existingOrderIds = new Set(existingOrders.map((o) => o.id));

      const newOrdersToCreate = orders.filter(
        (o) => !existingOrderIds.has(o.id)
      );

      if (newOrdersToCreate.length === 0) {
        console.log("All fetched orders already exist in the database.");
        return { createdCount: 0, message: "No new orders to add." };
      }

      const createPromises = newOrdersToCreate.map((order) => {
        const orderTags = order.tags.split(",").map((t) => t.trim()).filter(Boolean);
        
        return prisma.order.create({
          data: {
            id: order.id,
            name: order.name,
            orderNumber: order.order_number,
            email: order.email,
            phone: order.phone,
            financialStatus: order.financial_status ? order.financial_status.toUpperCase() : null,
            fulfillmentStatus: order.fulfillment_status ? order.fulfillment_status.toUpperCase() : null,
            currency: order.currency,
            totalPrice: order.total_price ? parseFloat(order.total_price) : 0,
            subtotalPrice: order.subtotal_price ? parseFloat(order.subtotal_price) : 0,
            totalTax: order.total_tax ? parseFloat(order.total_tax) : 0,
            totalDiscounts: order.total_discounts ? parseFloat(order.total_discounts) : 0,
            totalLineItemsPrice: order.total_line_items_price ? parseFloat(order.total_line_items_price) : 0,
            createdAt: order.created_at ? new Date(order.created_at) : new Date(),
            updatedAt: order.updated_at ? new Date(order.updated_at) : new Date(),
            processedAt: order.processed_at ? new Date(order.processed_at) : null,
            cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : null,
            cancelReason: order.cancel_reason,
            note: order.note,
            token: order.token,
            orderStatusUrl: order.order_status_url,
            customerId: order.customer ? order.customer.id : null,
            tags: {
              create: orderTags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            },
          },
        });
      });
      
      const result = await prisma.$transaction(createPromises);

      return {
        createdCount: result.length,
        message: `Successfully created ${result.length} new orders.`,
      };
    } catch (error) {
      console.error("Error creating orders:", error);
      throw new CustomError("Failed to create orders in the database", 500);
    }
  }
}
export default OrderService;