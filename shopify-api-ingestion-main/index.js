import dotenv from "dotenv";
dotenv.config();
import express from "express";
import productRouter from "./routes/product.route.js";
import customerRouter from "./routes/customer.route.js";
import orderRouter from "./routes/order.route.js";
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/product", productRouter);
app.use("/api/customer", customerRouter);
app.use("/api/order", orderRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
