// app.js
const express = require("express");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

// Setup transporter (using Gmail as example)
// ⚠️ Replace with your real email & app password
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",      // your email
    pass: "your-app-password",         // use App Password (not normal password)
  },
});

// Route to send email
app.get("/sendemail", async (req, res) => {
  try {
    let info = await transporter.sendMail({
      from: `"NEM Student" <your-email@gmail.com>`, // sender address
      to: ["your-email@gmail.com", "venugopal.burli@masaischool.com"], // recipients
      subject: "Test Email from NEM Student",
      text: "This is a testing Mail sent by NEM student, no need to reply.",
    });

    res.send(`✅ Email sent successfully! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error sending email.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
