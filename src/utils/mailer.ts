import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (to: string, link: string) => {
  await transporter.sendMail({
    from: `"Skill App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset",
    html: `
      <h3>Password Reset Request</h3>
      <p>Click below to reset your password:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });

  console.log("✅ Email sent");
};