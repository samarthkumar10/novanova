import express from "express";
import OrderController from "../controller/order.controller.js";
const router = express.Router();

router.get("/create", OrderController.createOrders);

export default router;
