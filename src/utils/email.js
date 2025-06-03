require("dotenv").config();
const nodemailer = require("nodemailer");


const sendEmailWithAttachment = async (to, subject, text, attachmentBuffer, attachmentName, contentType) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to,
      subject,
      text,
      attachments: [
        {
          filename: attachmentName,
          content: attachmentBuffer,
          contentType,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};


module.exports = { sendEmailWithAttachment };
