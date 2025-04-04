const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Fix CORS: Allow requests from localhost & Firebase Hosting
const allowedOrigins = ["http://localhost:4200", "https://signuploginapp-e51b2.web.app"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy does not allow access from this origin"), false);
    }
  },
  credentials: true
}));

app.use(express.json());

// ✅ Handle Preflight `OPTIONS` Requests for CORS
app.options("*", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).send("");
});

// 🔹 Secure Credentials Using Firebase Secret Manager
exports.sendEmail = functions
  .runWith({ secrets: ["GMAIL_EMAIL", "GMAIL_PASSWORD"] })
  .https.onRequest(async (req, res) => {
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailPassword = process.env.GMAIL_PASSWORD;

    if (!gmailEmail || !gmailPassword) {
      return res.status(500).json({ error: "Missing email credentials in Firebase Secrets." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailEmail, pass: gmailPassword },
    });

    try {
      const { email, firstname, missingDocuments } = req.body;

      if (!email || !firstname || !missingDocuments) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const mailOptions = {
        from: gmailEmail,
        to: email,
        subject: "❗ Missing Onboarding Documents",
        html: `<p>Dear ${firstname},</p>
               <p>Your onboarding process is <strong>incomplete</strong>. You are missing the following documents:</p>
               <ul>${missingDocuments.map(doc => `<li>${doc}</li>`).join("")}</ul>
               <p>Please submit these documents as soon as possible.</p>
               <p>Best regards,<br>Your HR Team</p>`,
      };

      await transporter.sendMail(mailOptions);

      // ✅ Set CORS headers for successful response
      res.set("Access-Control-Allow-Origin", "*");
      return res.status(200).json({ success: true, message: "Email sent successfully" });

    } catch (error) {
      console.error("❌ Error sending email:", error);
      res.set("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ success: false, error: error.message });
    }
  });

// ✅ Explicitly listen on PORT 8080 to prevent timeout errors
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
