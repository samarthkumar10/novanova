import express from "express";
import ProductController from "../controller/product.controller.js";

const router = express.Router();

router.get("/create", ProductController.createProducts);

export default router;
