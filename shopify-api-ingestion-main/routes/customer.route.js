import express from "express";
import CustomerController from "../controller/customer.controller.js";
const router = express.Router();

router.get("/create", CustomerController.createCustomer);

export default router;
