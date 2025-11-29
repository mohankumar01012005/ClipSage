// routes/razorpay.js
import express from "express";
import crypto from "crypto";
import Payment from "../models/razorpaySchema.js";
import razorpay from "razorpay";
import User from "../models/user.js";

const razorrouter = express.Router();

if (!process.env.RAZORPAY_ID_KEY || !process.env.RAZORPAY_SECRET_KEY) {
  console.error("Razorpay keys missing. Please set RAZORPAY_ID_KEY and RAZORPAY_SECRET_KEY in .env");
  // don't exit in router file, but it's good to know early
}

const instance = new razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// POST /api/pay/checkout/:userId
razorrouter.post("/checkout/:userId", async (req, res) => {
  const userId = req.params.userId;
  const protype = req.body.protype || "Pro";
  // Expect amount IN RUPEES from frontend, convert to paise here:
  const amountRupees = Number(req.body.amount);
  if (!amountRupees || Number.isNaN(amountRupees) || amountRupees <= 0) {
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    const options = {
      amount: Math.round(amountRupees), // convert rupees -> paise ONCE
      currency: "INR",
      notes: {
        userId,
        planType: protype,
      },
    };

    const order = await instance.orders.create(options);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    // Better logging: error may include error.error, error.statusCode, error.description
    console.error("Order creation error:", error);

    // Normalize error details safely
    const detail =
      error?.error?.description ||
      error?.message ||
      (typeof error === "object" ? JSON.stringify(error) : String(error));

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      detail,
    });
  }
});

razorrouter.post("/paymentverification", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, notes } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    const userId = notes?.userId;
    const planType = notes?.planType;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumType: planType || "Pro",
        premiumSince: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
      error: error.message,
    });
  }
});

razorrouter.get("/getkey", (req, res) => {
  return res.status(200).json({ key: process.env.RAZORPAY_ID_KEY || "" });
});

export default razorrouter;
