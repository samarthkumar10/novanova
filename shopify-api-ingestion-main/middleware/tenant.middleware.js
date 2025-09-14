import CustomError from "../utils/custom_error.js";

export const tenantMiddleware = (req, res, next) => {
  // Extract tenant ID from headers or subdomain
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId || 'default';
  
  if (!tenantId) {
    throw new CustomError("Tenant ID is required", 400);
  }

  // Add tenant context to request
  req.tenant = {
    id: tenantId,
    shopifyStore: process.env[`SHOPIFY_STORE_${tenantId.toUpperCase()}`] || process.env.SHOPIFY_STORE,
    accessToken: process.env[`ACCESS_TOKEN_${tenantId.toUpperCase()}`] || process.env.ACCESS_TOKEN
  };

  next();
};