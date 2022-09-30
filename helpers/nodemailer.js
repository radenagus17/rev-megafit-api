const url = require("url");
const nodemailer = require("nodemailer");

const baseUrlServer = "http://209.97.175.174:3000";
const baseUrlClient = "http://megafit.co.id";

let transporter = nodemailer.createTransport({
  host: "mail.megafit.co.id",
  port: 456, // 587
  secure: true, // false
  auth: {
    user: "info@megafit.co.id",
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const mailOptions = {
  from: "Megafit <info@megafit.co.id>",
  to: "",
};

const footerMail = `
  <div style="margin-top:20px;text-align:center;">
    <img src="${baseUrlServer}/asset/img/pola-megafit_black.png" height="17" width="100" alt="logo-bni" />
  </div>
  <div style="width:80;font-size:xx-small;text-align:center;">
    <p style="margin:0px;">Ikuti kami</p>
    <img src="${baseUrlServer}/asset/img/ig.png" height="15" width="15" alt="logo-bni" />
  </div>
  <div
  style="text-align:center;background-color:#dcdcdc;padding:10px;margin-top:5px;font-size:x-small;">
    <p style="margin:0px 5px 0px 0px">Jika butuh bantuan <a href="https://api.whatsapp.com/send?phone=6281317762785" style="color:#91c640;">klik sini</a></p>
  </div>`;

async function sendErrorReport(req, user, body, error) {
  var urlobj = url.parse(req.originalUrl);
  urlobj.protocol = req.protocol;
  urlobj.host = req.get("host");

  mailOptions.to = "info@megafit.co.id";
  mailOptions.subject = `Megafit website error report.`;
  mailOptions.html = `
    <img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
  
    <p style="font-size: 20px;margin-bottom: 5px;"><b>This is your megafit error report</b></p>
    <p style="margin:10px 0px 0px 0px;">Routes : ${url.format(urlobj)}</p>
    <p style="margin: 0px;">User : ${user}</p>
    <p style="margin: 0px;">Body : ${body}</p>
    <p style="margin: 0px;">Error : ${error}</p>
  
    ${footerMail}
    `;

  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("GAGAL", mailOptions.to);
      console.log(error);
    } else {
      console.log("Berhasil", mailOptions.to);
    }
  });
}

module.exports = {
  mailOptions,
  transporter,
  footerMail,
  baseUrlClient,
  baseUrlServer,
  sendErrorReport,
};
