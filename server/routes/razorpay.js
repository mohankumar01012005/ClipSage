import express from "express"
import crypto from "crypto"
import Payment from "../models/razorpaySchema.js"
import razorpay from "razorpay"
import User from "../models/user.js"
const razorrouter = express.Router()

const instance = new razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})

// checkout api
razorrouter.post("/checkout/:userId", async (req, res) => {
  const userId = req.params.userId
  const protype = req.body.protype
  try {
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
      notes: {
        userId: userId,
        planType: protype,
      },
    }
    const order = await instance.orders.create(options)
    res.status(200).json({ success: true, order })
  } catch (error) {
    console.error("Order creation error:", error)
    res.status(500).json({ success: false, error })
  }
})

razorrouter.post("/paymentverification", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, notes } = req.body

    // Verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      // Save payment record
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      })

      const userId = notes?.userId
      const planType = notes?.planType

      // Update user status if userId is available
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isPro: true,
          protype: planType || "Pro",
        })
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
      })
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
      error: error.message,
    })
  }
})

razorrouter.get("/api/getkey", (req, res) => {
  return res.status(200).json({ key: process.env.RAZORPAY_ID_KEY })
})

export default razorrouter
