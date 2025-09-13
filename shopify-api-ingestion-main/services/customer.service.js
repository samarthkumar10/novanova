import CustomError from "../utils/custom_error.js";
import axios from "axios";
import prisma from "../config/db.js";

const { SHOPIFY_STORE, ACCESS_TOKEN } = process.env;

class CustomerService {
  static async getCustomers() {
    try {
      const response = await axios.get(
        `https://${SHOPIFY_STORE}/admin/api/2025-07/customers.json?limit=50`,
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

      return response.data.customers;
    } catch (err) {
      console.error("Error fetching customers:", err);
      if (err instanceof CustomError) {
        throw err;
      }
      throw new CustomError("Failed to fetch customers from Shopify", 500);
    }
  }

  static async createCustomers(customers) {
    if (!customers || customers.length === 0) {
      console.log("No customers provided to create.");
      return { createdCount: 0, message: "No customers to process." };
    }

    try {
      // 1. Get all incoming customer IDs from the Shopify data
      const incomingCustomerIds = customers.map((c) => c.id);

      // 2. Find which customers already exist in our DB
      const existingCustomers = await prisma.customer.findMany({
        where: { id: { in: incomingCustomerIds } },
        select: { id: true },
      });
      const existingCustomerIds = new Set(existingCustomers.map((c) => c.id));

      // 3. Filter to get only the new customers
      const newCustomersToCreate = customers.filter(
        (c) => !existingCustomerIds.has(c.id)
      );

      if (newCustomersToCreate.length === 0) {
        console.log("All fetched customers already exist in the database.");
        return { createdCount: 0, message: "No new customers to add." };
      }

      // 4. Prepare the creation logic for each new customer
      const createPromises = newCustomersToCreate.map((customer) => {
        const customerTags = customer.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const defaultAddressId = customer.default_address
          ? customer.default_address.id
          : null;

        // Safely access nested consent objects
        const emailConsent = customer.email_marketing_consent;
        const smsConsent = customer.sms_marketing_consent;

        return prisma.customer.create({
          data: {
            id: customer.id,
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: customer.phone,
            ordersCount: customer.orders_count,
            state: customer.state.toUpperCase(), // e.g., "disabled" -> "DISABLED"
            totalSpent: customer.total_spent,
            note: customer.note,
            verifiedEmail: customer.verified_email,
            taxExempt: customer.tax_exempt,
            currency: customer.currency,
            createdAt: customer.created_at,
            updatedAt: customer.updated_at,

            // Flattened marketing data with safe defaults
            emailMarketingState:
              emailConsent?.state.toUpperCase() ?? "NOT_SUBSCRIBED",
            emailMarketingOptInLevel:
              emailConsent?.opt_in_level?.toUpperCase() ?? null,
            emailMarketingConsentUpdatedAt: emailConsent?.consent_updated_at,
            smsMarketingState:
              smsConsent?.state.toUpperCase() ?? "NOT_SUBSCRIBED",
            smsMarketingConsentUpdatedAt: smsConsent?.consent_updated_at,

            // Nested create for the one-to-many addresses relationship
            addresses: {
              create: customer.addresses.map((addr) => ({
                id: addr.id,
                address1: addr.address1,
                address2: addr.address2,
                city: addr.city,
                province: addr.province,
                country: addr.country,
                zip: addr.zip,
                phone: addr.phone,
                company: addr.company,
                countryCode: addr.country_code,
                isDefault: addr.id === defaultAddressId, // Set the default flag
              })),
            },

            // Nested create for the many-to-many tags relationship
            tags: {
              create: customerTags.map((tagName) => ({
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

      // 5. Execute all creations in a single transaction
      const result = await prisma.$transaction(createPromises);

      console.log(`Successfully created ${result.length} new customers.`);
      return {
        createdCount: result.length,
        message: `Successfully created ${result.length} new customers.`,
      };
    } catch (err) {
      console.error("Error creating customers:", err);
      throw new CustomError("Failed to save customers to the database", 500);
    }
  }
}

export default CustomerService;
