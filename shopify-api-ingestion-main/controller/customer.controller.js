import CustomerService from "../services/customer.service.js";

class CustomerController {
  static async createCustomer(req, res) {
    try {
      const customerData = await CustomerService.getCustomers();
      const result = await CustomerService.createCustomers(customerData);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default CustomerController;
