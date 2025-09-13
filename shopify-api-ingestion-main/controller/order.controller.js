import OrderService from "../services/order.service.js";

class OrderController {
  static async createOrders(req, res) {
    try {
      const orders = await OrderService.getOrder();

      const result = await OrderService.createOrders(orders);
      res.status(200).json(result);
    } catch (err) {
      console.error("Error in getOrder controller:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default OrderController;
