import prisma from '../config/db.js';
import CustomError from '../utils/custom_error.js';

class AnalyticsController {
  static async getDashboardOverview(req, res) {
    try {
      const tenantId = req.tenant.id;

      const [totalCustomers, totalOrders, totalProducts, totalRevenue] = await Promise.all([
        // Total customers
        prisma.customer.count({
          where: { tenantId }
        }),

        // Total orders
        prisma.order.count({
          where: { tenantId }
        }),

        // Total products
        prisma.product.count({
          where: { tenantId }
        }),

        // Total revenue
        prisma.order.aggregate({
          where: { 
            tenantId,
            totalPrice: { not: null }
          },
          _sum: { totalPrice: true }
        })
      ]);

      res.json({
        overview: {
          totalCustomers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue._sum.totalPrice || 0
        }
      });

    } catch (error) {
      console.error("Dashboard overview error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard overview" });
    }
  }

  static async getOrdersByDate(req, res) {
    try {
      const tenantId = req.tenant.id;
      const { startDate, endDate } = req.query;

      let whereClause = { tenantId };
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const orders = await prisma.order.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { createdAt: 'asc' }
      });

      // Group by day
      const ordersByDay = orders.reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 };
        }
        acc[date].count += order._count.id;
        acc[date].revenue += parseFloat(order._sum.totalPrice || 0);
        return acc;
      }, {});

      res.json({ ordersByDay });

    } catch (error) {
      console.error("Orders by date error:", error);
      res.status(500).json({ error: "Failed to fetch orders by date" });
    }
  }

  static async getTopCustomers(req, res) {
    try {
      const tenantId = req.tenant.id;
      const limit = parseInt(req.query.limit) || 5;

      const topCustomers = await prisma.customer.findMany({
        where: { tenantId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalSpent: true,
          ordersCount: true
        },
        orderBy: { totalSpent: 'desc' },
        take: limit
      });

      res.json({ topCustomers });

    } catch (error) {
      console.error("Top customers error:", error);
      res.status(500).json({ error: "Failed to fetch top customers" });
    }
  }

  static async getRevenueAnalytics(req, res) {
    try {
      const tenantId = req.tenant.id;
      const { period = '30d' } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const revenueData = await prisma.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          totalPrice: { not: null }
        },
        select: {
          createdAt: true,
          totalPrice: true,
          currency: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group revenue by day/week/month based on period
      const groupedRevenue = this.groupRevenueByPeriod(revenueData, period);

      res.json({ 
        revenueAnalytics: groupedRevenue,
        period,
        dateRange: { startDate, endDate }
      });

    } catch (error) {
      console.error("Revenue analytics error:", error);
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  }

  static groupRevenueByPeriod(data, period) {
    const grouped = {};
    
    data.forEach(order => {
      let key;
      const date = new Date(order.createdAt);
      
      switch (period) {
        case '7d':
        case '30d':
          key = date.toISOString().split('T')[0]; // Group by day
          break;
        case '90d':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0]; // Group by week
          break;
        case '1y':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Group by month
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, orders: 0 };
      }
      
      grouped[key].revenue += parseFloat(order.totalPrice);
      grouped[key].orders += 1;
    });
    
    return grouped;
  }

  static async getProductPerformance(req, res) {
    try {
      const tenantId = req.tenant.id;

      const productPerformance = await prisma.product.findMany({
        where: { tenantId },
        select: {
          id: true,
          title: true,
          vendor: true,
          lineItems: {
            select: {
              quantity: true,
              price: true
            }
          }
        }
      });

      const performanceData = productPerformance.map(product => {
        const totalQuantitySold = product.lineItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = product.lineItems.reduce((sum, item) => 
          sum + (parseFloat(item.price) * item.quantity), 0);

        return {
          id: product.id,
          title: product.title,
          vendor: product.vendor,
          totalQuantitySold,
          totalRevenue,
          averageOrderValue: totalQuantitySold > 0 ? totalRevenue / totalQuantitySold : 0
        };
      });

      // Sort by revenue desc
      performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

      res.json({ productPerformance: performanceData });

    } catch (error) {
      console.error("Product performance error:", error);
      res.status(500).json({ error: "Failed to fetch product performance" });
    }
  }
}

export default AnalyticsController;