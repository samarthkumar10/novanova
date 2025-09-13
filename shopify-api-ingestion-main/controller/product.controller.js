import ProductService from "../services/product.service.js";

class ProductController {
  static async createProducts(req, res) {
    try {
      const data = await ProductService.getProducts();

      const result = await ProductService.createProducts(data);
      res.status(201).json(result);
    } catch (err) {
      console.error("Error fetching products:", err);
      res
        .status(err.statusCode || 500)
        .json({ error: err.message || "Failed to fetch products" });
    }
  }
}

export default ProductController;
