const nodemailer = require("nodemailer");

/*
-----------------------------------
BREVO SMTP TRANSPORTER
-----------------------------------
*/

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT),
    secure: false,

    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
    }
});

/*
-----------------------------------
SEND OTP EMAIL
-----------------------------------
*/

const sendOTPEmail = async (email, otp) => {

    const mailOptions = {
        from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,

        to: email,

        subject: "Face Attendance - Password Reset OTP",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 500px;
                margin: 40px auto;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 12px;
                background-color: #ffffff;
            ">

                <h2 style="
                    text-align: center;
                    color: #222;
                    margin-bottom: 25px;
                ">
                    Face Attendance System
                </h2>

                <p style="
                    font-size: 15px;
                    color: #333;
                ">
                    We received a request to reset your password.
                </p>

                <p style="
                    font-size: 15px;
                    color: #333;
                ">
                    Your password reset OTP is:
                </p>

                <div style="
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    margin: 30px 0;
                    padding: 15px;
                    background-color: #f5f5f5;
                    border-radius: 8px;
                ">
                    ${otp}
                </div>

                <p style="
                    font-size: 14px;
                    color: #555;
                ">
                    This OTP will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p style="
                    font-size: 14px;
                    color: #555;
                ">
                    If you did not request a password reset,
                    please ignore this email.
                </p>

                <hr style="
                    margin: 25px 0;
                    border: none;
                    border-top: 1px solid #ddd;
                ">

                <p style="
                    font-size: 12px;
                    color: #777;
                    text-align: center;
                ">
                    Face Attendance System
                </p>

            </div>
        `
    };

    await transporter.sendMail(mailOptions);

    console.log(`OTP email sent successfully to ${email}`);
};

/*
-----------------------------------
EXPORT
-----------------------------------
*/

module.exports = {
    sendOTPEmail
};