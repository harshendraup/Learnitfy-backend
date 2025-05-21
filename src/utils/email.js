require("dotenv").config();
const nodemailer = require("nodemailer");


const sendEmailWithAttachment = async (to, subject, text, attachmentPath, attachmentName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "pankaj1184783@gmail.com",
        pass: "xviy efjj pdrd ohwn",
      },
    });

    const mailOptions = {
      from:"pankaj1184783@gmail.com",
      to,
      subject,
      text,
      attachments: [
        {
          filename: attachmentName,
          path: attachmentPath,
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
