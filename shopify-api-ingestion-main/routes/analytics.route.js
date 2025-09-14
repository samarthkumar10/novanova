import express from 'express';
import AnalyticsController from '../controller/analytics.controller.js';

const router = express.Router();

router.get('/overview', AnalyticsController.getDashboardOverview);
router.get('/orders-by-date', AnalyticsController.getOrdersByDate);
router.get('/top-customers', AnalyticsController.getTopCustomers);
router.get('/revenue', AnalyticsController.getRevenueAnalytics);
router.get('/product-performance', AnalyticsController.getProductPerformance);

export default router;