export class TenantHelper {
  static getTenantFilter(tenantId) {
    return { tenantId: tenantId };
  }

  static addTenantData(data, tenantId) {
    if (Array.isArray(data)) {
      return data.map(item => ({ ...item, tenantId }));
    }
    return { ...data, tenantId };
  }
}