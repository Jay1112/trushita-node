require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@sanity/client");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false, // set to false for real-time updates and mutations
  token: process.env.SANITY_TOKEN,
  apiVersion: "2024-05-16", // use current date
});

app.get("/", (req, res) => {
  res.send("Backend is up and running");
});

app.post("/api/v1/order/create", async (req, res) => {
  try {
    const orderData = req.body;
    
    // Construct the document based on the Sanity schema
    const doc = {
      _type: "order",
      address: {
        fullName: orderData.address?.fullName,
        mobileNumber: orderData.address?.mobileNumber,
        address: orderData.address?.address,
        state: orderData.address?.state,
        city: orderData.address?.city,
        zipCode: orderData.address?.zipCode,
        additionalInformation: orderData.address?.additionalInformation,
      },
      status: orderData.status || "Payment Pending",
      creationDate: new Date().toISOString(),
      products: orderData.products ? orderData.products.map(p => ({
        _key: Math.random().toString(36).substring(7), // Sanity arrays need keys
        _type: "orderProduct",
        productId: p.productId,
        title: p.title,
        quantity: p.quantity,
        perQuantityAmount: p.perQuantityAmount,
        totalAmount: p.totalAmount,
      })) : [],
      totalOrderAmount: orderData.totalOrderAmount,
    };

    const result = await sanityClient.create(doc);
    res.status(201).json({ success: true, message: "Order created successfully", data: result });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
  }
});

app.get("/api/v1/order/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sanityClient.getDocument(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.status(200).json({ success: true, message: "Order fetched successfully", data: result });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});