const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: process.env.MAIL_PROVIDER,
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASSWORD
    }
  });
  
const sendWelcomeEmail = (email, name) => {
    const mailOptions = {
        from: process.env.MAIL_EMAIL,
        to: email,
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    };

    transporter.sendMail(mailOptions, (error, info) => {  
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });
}

const sendCancelationEmail = (email, name) => {
    const mailOptions = {
        from: 'godofredosenior@gmail.com',
        to: email,
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. I hope to see you back soon.`
    };

    transporter.sendMail(mailOptions, (error, info) => {  
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}