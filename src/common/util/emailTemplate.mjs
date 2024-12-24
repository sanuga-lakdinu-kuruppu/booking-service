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

export const getEmailBodyForPaymentSuccess = (
  firstName,
  bookingId,
  trip,
  seatNumber,
  price
) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful - Booking Confirmation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
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
                  background-color: #28a745;
                  color: #ffffff;
                  text-align: center;
                  padding: 20px;
              }
              .header h1 {
                  margin: 0;
                  font-size: 26px;
                  font-weight: bold;
              }
              .content {
                  padding: 30px;
                  font-size: 16px;
                  line-height: 1.6;
              }
              .content p {
                  margin: 15px 0;
              }
              .content ul {
                  margin: 10px 0;
                  padding-left: 20px;
              }
              .footer {
                  text-align: center;
                  padding: 20px;
                  font-size: 12px;
                  color: #777;
                  background-color: #f8f8f8;
                  border-top: 1px solid #e0e0e0;
              }
              .footer a {
                  color: #0073e6;
                  text-decoration: none;
              }
              .highlight {
                  font-weight: bold;
                  color: #333;
              }
              .price {
                  color: #28a745;
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>Booking Payment Successful</h1>
              </div>
              <div class="content">
                  <p>Dear ${firstName},</p>
                  <p>We are pleased to inform you that your payment for Booking ID <span class="highlight">${bookingId}</span> has been successfully processed.</p>
                  <p>Your booking details are as follows:</p>
                  <ul>
                      <li><strong>Trip Number:</strong> ${trip.tripNumber}</li>
                      <li><strong>Route:</strong> ${trip.route.routeName}</li>
                      <li><strong>Seat Number:</strong> ${seatNumber}</li>
                      <li><strong>Trip Date:</strong> ${trip.tripDate}</li>
                      <li><strong>Departure Time:</strong> ${trip.schedule.departureTime}</li>
                      <li><strong>Arrival Time:</strong> ${trip.schedule.arrivalTime}</li>
                      <li><strong>Price:</strong> <span class="price">Rs. ${price}.00</span></li>
                  </ul>
                  <br>
                  <p><strong>Cancellation Policy:</strong> ${trip.cancellationPolicy.description}</p>
                  <br>
                  <p>Your booking has been confirmed, and we look forward to welcoming you on board.</p>
                  <p>Please note that your ticket and QR code will be sent to you in a separate email shortly.</p>
                  <p>If you require any further assistance, please do not hesitate to contact our support team.</p>
              </div>
              <div class="footer">
                  <p>&copy; 2024 [Your Company Name]. All rights reserved.</p>
                  <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:support@yourcompany.com">Contact Support</a></p>
              </div>
          </div>
      </body>
      </html>`;
};

export const getEmailBodyForETicketAndQR = (
  firstName,
  bookingId,
  qr,
  eTicket
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your E-Ticket and QR Code</title>
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
            .ticket-info {
                background-color: #f0f0f0;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
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
                <h1>Your E-Ticket and QR Code</h1>
            </div>
            <div class="content">
                <p>Dear ${firstName},</p>
                <p>We are excited to share your e-ticket and QR code for your upcoming trip. Below are your booking details:</p>
                <div class="ticket-info">
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                    <p><strong>E Ticket:</strong> ${eTicket}</p>
                </div>
                <p><strong>Your QR Code:</strong></p>
                <p><img src="${qr}" alt="QR Code" /></p>
                <p>Use this QR code for easy check-in at the boarding gate.</p>
                <p>If you have any questions or need assistance, don’t hesitate to reach out to our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 [Your Company Name]. All rights reserved.</p>
                <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:support@yourcompany.com">Contact Support</a></p>
            </div>
        </div>
    </body>
    </html>`;
};

export const getEmailBodyForBookingCancellation = (
  firstName,
  bookingId,
  tripId,
  cancellationTime,
  cancellationPolicy
) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Cancellation Confirmation</title>
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
                  background-color: #d9534f;
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
              .info-box {
                  background-color: #f0f0f0;
                  padding: 15px;
                  border-radius: 5px;
                  margin-top: 20px;
              }
              .footer {
                  text-align: center;
                  padding: 15px;
                  font-size: 12px;
                  color: #777;
                  border-top: 1px solid #e0e0e0;
              }
              .footer a {
                  color: #d9534f;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>Booking Cancellation Confirmation</h1>
              </div>
              <div class="content">
                  <p>Dear ${firstName},</p>
                  <p>We regret to inform you that your booking has been cancelled. Below are the details of your cancellation:</p>
                  <div class="info-box">
                      <p><strong>Booking ID:</strong> ${bookingId}</p>
                      <p><strong>Trip ID:</strong> ${tripId}</p>
                      <p><strong>Cancellation Time:</strong> ${cancellationTime}</p>
                      <p><strong>Cancellation Policy:</strong> ${cancellationPolicy}</p>
                  </div>
                  <p>You can receive your refund in accordance with our cancellation policy at the nearest main bus station. Please bring your e-ticket or booking ID along with your NIC card to facilitate the refund process.</p>
                  <p>If you have any further questions, feel free to contact our support team. Thank you for choosing our service, and we hope to serve you again in the future.</p>
              </div>
              <div class="footer">
                  <p>&copy; 2024 [Your Company Name]. All rights reserved.</p>
                  <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:support@yourcompany.com">Contact Support</a></p>
              </div>
          </div>
      </body>
      </html>`;
};

export const getEmailBodyForSuccessfulOnboarding = (
  firstName,
  bookingId,
  tripNumber
) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Successful Commuter Onboard</title>
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
              .ticket-info {
                  background-color: #f0f0f0;
                  padding: 15px;
                  border-radius: 5px;
                  margin-top: 20px;
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
                  <h1>Successful Commuter Onboardn</h1>
              </div>
              <div class="content">
                  <p>Dear ${firstName},</p>
                  <p>We are pleased to confirm that your e-ticket has been successfully used for the trip. Below are the details of your booking:</p>
                  <div class="ticket-info">
                      <p><strong>Booking ID:</strong> ${bookingId}</p>
                      <p><strong>Trip :</strong> ${tripNumber}</p>
                  </div>
                  <p>We trust that your journey will be smooth and enjoyable. If you did not authorize this ticket usage or suspect any unauthorized activity, please contact our support team immediately at <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.</p>
                  <p>Your security and satisfaction are our highest priorities.</p>
              </div>
              <div class="footer">
                  <p>&copy; 2024 [Your Company Name]. All rights reserved.</p>
                  <p><a href="https://yourwebsite.com">Visit our website</a> | <a href="mailto:support@yourcompany.com">Contact Support</a></p>
              </div>
          </div>
      </body>
      </html>`;
};
