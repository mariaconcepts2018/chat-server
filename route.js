import User from './models/User.js';
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);



export const postUser= async (req, res) => {
  
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = new User({ name, phone, email });
    await newUser.save();

    res.status(201).json({ message: "User saved successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
      .verifications
      .create({ to: `+91${phone}`, channel: "sms" });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
}

export const verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code)
      return res.status(400).json({ message: "Phone and code are required" });

    const verificationCheck = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks
      .create({ to: `+91${phone}`, code });

    if (verificationCheck.status === "approved") {
      await User.findOneAndUpdate({ phone }, { isVerified: true }, { upsert: true });
      res.json({ message: "Phone number verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
}