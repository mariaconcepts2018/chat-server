import User from "./models/User.js";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const updateUser = async (req, res) => {
  try {
    const { name, email, location, phone, ...filterdObject } = req.body;

    await User.findOneAndUpdate({ phone }, filterdObject);

    res.status(201).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone)
      return res.status(400).json({ message: "Phone number is required" });

    await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { name, phone, code, email, location } = req.body;

    if (!phone || !code)
      return res.status(400).json({ message: "Phone and code are required" });

    // const verificationCheck = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
    //   .verificationChecks
    //   .create({ to: `+91${phone}`, code });

    if (code === "1234") {
      // if (verificationCheck.status === "approved") {

      if (!name || !phone || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const newUser = new User({ name, phone, email, location });
      await newUser.save();

      res
        .status(201)
        .json({ message: "User saved successfully", user: newUser });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};

export const fetchUsers = async (req, res) => {
  try {
    const {
      id,
      name,
      createdAt,
      leadSource,
      projectType,
      service,
      leadStatus,
    } = req.query;

    // Build dynamic filter object
    const filter = {};

    if (name) filter.name = new RegExp(name, "i"); // case-insensitive match
    if (id) filter.id = id;
    if (createdAt) filter.createdAt = createdAt;
    if (leadSource) filter.leadSource = leadSource;
    if (projectType) filter.projectType = projectType;
    if (service) filter.createdAt = service;
    if (leadStatus) filter.createdAt = leadStatus;

    const users = await User.find(filter, {
      _id: 1,
      name: 1,
      createdAt: 1,
      leadSource: 1,
      projectType: 1,
      service: 1,
      leadStatus: 1,
      modifiedBy: 1,
      modifiedOn: 1,
    }).sort({ createdAt: -1 });

    res.json({ count: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({ _id: userId });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserAdmin = async (req, res) => {
  try {
    const userId = req.params.userId;

    const { leadStatus, appointmentDate, notes, modifiedBy } = req.body;

    const user = await User.findByIdAndUpdate(userId, {
      leadStatus: leadStatus,
      appointmentDate: appointmentDate,
      notes: notes,
      modifiedBy: modifiedBy,
      modifiedOn: Date.now(),
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
