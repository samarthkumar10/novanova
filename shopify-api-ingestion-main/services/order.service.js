import axios from "axios";
import prisma from "../config/db.js";
import CustomError from "../utils/custom_error.js";
const { SHOPIFY_STORE, ACCESS_TOKEN } = process.env;

class OrderService {
  static async getOrder() {
    try {
      const response = await axios.get(
        `https://${SHOPIFY_STORE}/admin/api/2025-07/orders.json?limit=50`,
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
      // 1. Get all incoming order IDs from the Shopify data
      const incomingOrderIds = orders.map((o) => o.id);
      // 2. Find which orders already exist in our DB
      const existingOrders = await prisma.order.findMany({
        where: { id: { in: incomingOrderIds } },
        select: { id: true },
      });
      const existingOrderIds = new Set(existingOrders.map((o) => o.id));

      // 3. Filter to get only the new orders
      const newOrdersToCreate = orders.filter(
        (o) => !existingOrderIds.has(o.id)
      );

      if (newOrdersToCreate.length === 0) {
        console.log("All fetched orders already exist in the database.");
        return { createdCount: 0, message: "No new orders to add." };
      }

      // 4. Bulk insert new orders
      const createdOrders = await prisma.order.createMany({
        data: newOrdersToCreate.map((o) => ({
          id: o.id,

          email: o.email,
          totalPrice: parseFloat(o.totalPrice),
          currency: o.currency,
          createdAt: new Date(),
          updatedAt: new Date(),
          customerId: o.customer ? o.customer.id : null,
        })),
        skipDuplicates: true,
      });
      return {
        createdCount: createdOrders.count,
        message: "New orders created successfully.",
      };
    } catch (error) {
      console.error("Error creating orders:", error);
      throw new CustomError("Failed to create orders in the database", 500);
    }
  }
}
export default OrderService;
