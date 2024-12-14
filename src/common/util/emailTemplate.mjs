export const getEmailBodyForCommuterVerification = (otp, firstName, delay) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commuter Verification OTP</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                background-color: #0073e6;
                color: #ffffff;
                text-align: center;
                padding: 20px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 20px;
            }
            .content p {
                margin: 10px 0;
                line-height: 1.6;
            }
            .otp {
                background-color: #28a745;
                color: #ffffff;
                font-size: 20px;
                font-weight: bold;
                padding: 10px 15px;
                border-radius: 5px;
                display: inline-block;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 15px;
                font-size: 12px;
                color: #777;
                border-top: 1px solid #e0e0e0;
            }
            .footer a {
                color: #0073e6;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Commuter Verification OTP</h1>
            </div>
            <div class="content">
                <p>Dear ${firstName},</p>
                <p>You initiated a commuter verification process with us. Please use the One-Time Password (OTP) below to complete the verification:</p>
                <p class="otp">${otp}</p>
                <p>This OTP is valid for <strong>${delay} minutes</strong>. After that, it will expire, and you’ll need to request a new OTP if necessary.</p>
                <p>For your security, please do not share this OTP with anyone.</p>
                <p>If you did not initiate this request, please ignore this email.</p>
                <p>Thank you for choosing [Your Company Name]. Should you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 [Your Company Name]. All rights reserved.</p>
                <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:support@yourcompany.com">Contact Support</a></p>
            </div>
        </div>
    </body>
    </html>`;
};
