const Xendit = require("xendit-node");
const x = new Xendit({
  secretKey: process.env.XENDIT_TOKEN,
});

const { Invoice } = x;
const invoiceSpecificOptions = {};
const invoice = new Invoice(invoiceSpecificOptions);

module.exports = invoice;
