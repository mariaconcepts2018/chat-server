import User from "./models/User.js";
import twilio from "twilio";
import dotenv from "dotenv";
import XLSX from "xlsx";
import ChatRoom from "./models/ChatRoom.js";
import Message from "./models/Message.js";

const LIMIT = 10;

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const updateUser = async (req, res) => {
  try {
    const { name, email, location, phone, company, ...filterdObject } =
      req.body;

    await User.findOneAndUpdate({ phone, company }, filterdObject);

    res.status(201).json({ message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error });
  }
};

export const addLead = async (req, res) => {
  try {
    const form = req.body;
    if (!form.name || !form.phone || !form.email || !form.company) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newUser = new User({ ...form, leadSource: "offline" });
    await newUser.save();

    res.status(201).json({ message: "User saved successfully", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { phone, company } = req.body;

    if (!phone)
      return res.status(400).json({ message: "Phone number is required" });

    await client.verify.v2
      .services(
        company === "mariaconcepts"
          ? process.env.TWILIO_SERVICE_SID_1
          : process.env.TWILIO_SERVICE_SID_2,
      )
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { name, phone, code, email, location, company, leadSource } =
      req.body;
    if (!phone || !code)
      return res.status(400).json({ message: "Phone and code are required" });

    const verificationCheck = await client.verify.v2
      .services(
        company === "mariaconcepts"
          ? process.env.TWILIO_SERVICE_SID_1
          : process.env.TWILIO_SERVICE_SID_2, //TWILIO_SERVICE_SID_2
      )
      .verificationChecks.create({ to: `+91${phone}`, code });

    // if (code === "1234") {
    if (verificationCheck.status === "approved") {
      if (!name || !phone || !email || !company) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const newUser = new User({
        name,
        phone,
        email,
        location,
        company,
        leadSource,
      });
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
      company,
      projectType,
      service,
      leadStatus,
      nextCursor,
    } = req.query;

    // Build dynamic filter object
    const filter = {};

    if (name) filter.name = new RegExp(name, "i"); // case-insensitive match
    if (id) filter._id = id;
    if (createdAt) filter.createdAt = createdAt;
    if (leadSource) filter.leadSource = leadSource;
    if (projectType) filter.projectType = projectType;
    if (service) filter.service = service;
    if (leadStatus) filter.leadStatus = leadStatus;
    if (company) filter.company = company;
    if (nextCursor) filter._id = { $lt: nextCursor };

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
      company: 1,
    })
      .sort({ _id: -1 })
      .limit(LIMIT + 1);

    const hasNextPage = users.length > LIMIT;
    if (hasNextPage) users.pop();

    res.json({
      count: users.length,
      users,
      hasNextPage,
      nextCursor: hasNextPage ? users.at(-1)?._id : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchUsersXlsx = async (req, res) => {
  try {
    const {
      id,
      name,
      createdAt,
      leadSource,
      company,
      projectType,
      service,
      leadStatus,
      nextCursor,
    } = req.query;

    // Build dynamic filter object
    const filter = {};

    if (name) filter.name = new RegExp(name, "i"); // case-insensitive match
    if (id) filter._id = id;
    if (createdAt) filter.createdAt = createdAt;
    if (leadSource) filter.leadSource = leadSource;
    if (projectType) filter.projectType = projectType;
    if (service) filter.service = service;
    if (leadStatus) filter.leadStatus = leadStatus;
    if (company) filter.company = company;
    if (nextCursor) filter._id = { $lt: nextCursor };

    const users = await User.find(filter, {
      _id: 1,
      name: 1,
      phone: 1,
      email: 1,
      createdAt: 1,
      leadSource: 1,
      appointmentDate: 1,
      projectType: 1,
      service: 1,
      leadStatus: 1,
      modifiedBy: 1,
      modifiedOn: 1,
      company: 1,
    })
      .sort({ _id: -1 })
      .limit(LIMIT);

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

export const fetchCounts = async (req, res) => {
  try {
    const open = await User.countDocuments({ leadStatus: "open" });
    const pending = await User.countDocuments({ leadStatus: "pending" });
    const closed = await User.countDocuments({ leadStatus: "closed" });

    const total = open + pending + closed;

    res.json({ open, pending, closed, total });
  } catch (error) {}
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

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Read uploaded XLSX file
    const workbook = XLSX.readFile(req.file.path);

    // Sheet name (take first sheet)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array
    const rows = XLSX.utils.sheet_to_json(sheet);

    /*
        rows example:
        [
          { name: "John", phone: "9999999999", email: "j@gmail.com", address: "Mumbai" },
          { name: "Sam", phone: "8888888888", email: "s@gmail.com", address: "Delhi" }
        ]
    */

    // Allowed fields to store in MongoDB
    const allowedFields = [
      "name",
      "service",
      "phone",
      "email",
      "location",
      "company",
    ];

    const formattedData = rows.map((row) => {
      const data = {};
      allowedFields.forEach((key) => {
        if (row[key] !== undefined) data[key] = row[key];
      });
      return data;
    });

    if (formattedData.length === 0)
      return res.status(400).json({ error: "No data found!" });

    const data = formattedData.map((item) => ({
      ...item,
      leadSource: "offline",
    }));

    // Insert all rows
    await User.insertMany(data);

    res.json({ status: "success", inserted: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const fetchChats = async (req, res) => {
  const chats = await ChatRoom.find({
    // unreadCountForAdmin: { $gt: 0 },
  }).sort({ createdAt: 1 });
  res.json(chats);
};

export const fetchPrevChats = async (req, res) => {
  const { roomId } = req.params;

  const messages = await Message.find({ roomId })
    .sort({ createdAt: -1 }) //  newest -> oldest
    .limit(50);
  res.json(messages);
};

export const fetchUserChats = async (req, res) => {
  const messages = await Message.find({
    roomId: req.params.roomId,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(messages);
};
