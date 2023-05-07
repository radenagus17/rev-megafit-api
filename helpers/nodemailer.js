const url = require("url");
const nodemailer = require("nodemailer");

const baseUrlServer = "http://209.97.175.174:3000";
const baseUrlClient = "http://megafit.co.id";

let transporter = nodemailer.createTransport({
  host: "mail.megafit.co.id",
  port: 587, // 465
  secure: false, // true
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
    <p style="margin:0px 5px 0px 0px">Jika butuh bantuan <a href="https://api.whatsapp.com/send?phone=6285890004840" style="color:#91c640;">klik sini</a></p>
  </div>`;

async function sendEmailRememberMembership(
  nickname,
  email,
  activeExpired,
  keterangan
) {
  mailOptions.to = email;
  if (keterangan) {
    mailOptions.subject = `Hi ${nickname} membership Megafit sudah berakhir & masuk masa tenggang, ayo perpanjang`;
  } else {
    mailOptions.subject = `Hi ${nickname} membership Megafit sisa 7 hari ayo perpanjang`;
  }
  mailOptions.html = `
    <img src="http://209.97.175.174:3000/asset/img/pola-megafit_black.png" height="30" width="150" alt="logo-megafit" />
  
    <p style="font-size: 20px;margin-bottom: 5px;"><b>Hai ${nickname}, membership Megafit ${
    keterangan
      ? `sudah berakhir & masuk masa tenggang`
      : `akan masuk masa tenggang pada ${activeExpired}`
  }</b></p>
    <p style="margin:10px 0px;">Perpanjang membership agar tetap bisa terus ke Megafit</p>
  
    <img src="http://209.97.175.174:3000/asset/img/perpanjang_membership.png" height="150" width="230" alt="logo-forget" />
  
    <p style="margin:10px 0px;">Ayo ke halaman user untuk perpanjang membership <a href="${baseUrlClient}/home">klik sini</a></p>
  
    <div style="border-radius:2px;background-color:#91c640;width:158px;margin-bottom:30px;">
      <a href="${baseUrlClient}/home/paket" target="_blank" style="padding: 8px 12px; border: 1px solid #91c640;border-radius: 2px;color: #ffffff;text-decoration: none;font-weight:bold;display: inline-block;">
        Perpanjang sekarang             
      </a>
    </div>
    
    <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
    <p style="margin:10px 0px;">Demi keamanan transaksi Anda, pastikan untuk tidak menginformasikan bukti dan data pembayaran kepada pihak manapun kecuali Megafit. Megafit tidak menerima pembayaran selain rekening diatas</p>
    <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
    <div style="text-align:center;font-size: small;">
      <b>Email ini dibuat secara otomatis. Mohon tidak mengirim balasan ke email ini.</b>
    </div>
    <div style="border-top:1px solid #aaa;font-size:0;margin:8px auto;"></div>
  
    ${footerMail}
    `;

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("GAGAL", mailOptions.to);
      console.log(error);
    } else {
      console.log("Berhasil", mailOptions.to);
    }
  });
}

async function sendErrorReport(req, user, body, error) {
  var urlobj = url.parse(req.originalUrl);
  urlobj.protocol = req.protocol;
  urlobj.host = req.get("host");

  mailOptions.to = "error@megafit.co.id";
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
  sendEmailRememberMembership,
};
