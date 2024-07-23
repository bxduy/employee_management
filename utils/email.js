import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Queue from 'bull';
dotenv.config()

// config transport to send email
const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailQueue = new Queue('email')
emailQueue.process(async (job, done) => {
    const { bcc, subject, text } = job.data

    try {
        await transporter.sendMail({
            from: process.env.EMAIL, // sender address
            bcc, // using BCC field for recipients
            subject,
            text,
        })
        done();
    } catch (error) {
        done(error)
    }
})

export default emailQueue