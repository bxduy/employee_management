import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config()

// config transport to send email
const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// send email
export const sendEmail = async (toEmail, subject, text) => {
    // config mail options
    const mailOptions = {
        from: process.env.EMAIL,
        to: toEmail,
        subject: subject,
        text: text
    };

    return transporter.sendMail(mailOptions);
};