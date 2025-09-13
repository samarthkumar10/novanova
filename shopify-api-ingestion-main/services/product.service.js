import CustomError from "../utils/custom_error.js";
import prisma from "../config/db.js";
import axios from "axios";

const { SHOPIFY_STORE, ACCESS_TOKEN } = process.env;

class ProductService {
  static async getProducts() {
    try {
      const response = await axios.get(
        `https://${SHOPIFY_STORE}/admin/api/2025-07/products.json?limit=50`,
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

      return response.data.products;
    } catch (err) {
      console.error("Error fetching products:", err);
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError("Failed to fetch products from Shopify", 500);
    }
  }

  static async createProducts(products) {
    if (!products || products.length === 0) {
      console.log("No products provided to create.");
      return { createdCount: 0, message: "No products to process." };
    }

    try {
      // ... code to find new products is the same ...
      const incomingProductIds = products.map((p) => p.id);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: incomingProductIds } },
        select: { id: true },
      });
      const existingProductIds = new Set(existingProducts.map((p) => p.id));
      const newProductsToCreate = products.filter(
        (p) => !existingProductIds.has(p.id)
      );

      if (newProductsToCreate.length === 0) {
        console.log("All fetched products already exist in the database.");
        return { createdCount: 0, message: "No new products to add." };
      }

      const createPromises = newProductsToCreate.map((product) => {
        const productTags = product.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        return prisma.product.create({
          data: {
            // ... product fields are the same ...
            id: product.id,
            title: product.title,
            handle: product.handle,
            bodyHtml: product.body_html,
            vendor: product.vendor,
            productType: product.product_type,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            publishedAt: product.published_at,
            status: product.status.toUpperCase(),

            variants: {
              create: product.variants.map((variant) => ({
                id: variant.id,
                title: variant.title,
                price: variant.price,
                compareAtPrice: variant.compare_at_price,

                // --- THIS IS THE FIX ---
                // If variant.sku is falsy (null, "", undefined), generate a unique fallback.
                sku: variant.sku || `fallback-sku-${product.id}-${variant.id}`,

                position: variant.position,
                inventoryPolicy: variant.inventory_policy.toUpperCase(),
                inventoryQuantity: variant.inventory_quantity,
                requiresShipping: variant.requires_shipping,
                taxable: variant.taxable,
                barcode: variant.barcode,
                weight: variant.weight,
                weightUnit: variant.weight_unit,
              })),
            },
            // ... images, options, tags sections are the same ...
            images: {
              create: product.images.map((image) => ({
                id: image.id,
                altText: image.alt,
                width: image.width,
                height: image.height,
                src: image.src,
              })),
            },
            options: {
              create: product.options.map((option) => ({
                id: option.id,
                name: option.name,
                position: option.position,
                values: option.values,
              })),
            },
            tags: {
              create: productTags.map((tagName) => ({
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

      console.log(`Successfully created ${result.length} new products.`);
      return {
        createdCount: result.length,
        message: `Successfully created ${result.length} new products.`,
      };
    } catch (err) {
      console.error("Error creating products:", err);
      throw new CustomError("Failed to save products to the database", 500);
    }
  }
}

export default ProductService;
