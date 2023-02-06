const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const TransactionController = require("../controllers/transaction");

router.post("/xendit-callback", TransactionController.callbackXenditInvoice);
router.use(authentication);
router.get("/", TransactionController.findAll);
router.post("/", TransactionController.create);
router.post("/checkout", TransactionController.checkout);
router.post("/invoice-xendit", TransactionController.createXenditInvoice);
router.post("/email", TransactionController.emailResi);
router.get("/check-member/:id", TransactionController.check);
router.get("/:id", TransactionController.findOne);
router.put("/:id", TransactionController.update);
// router.put("/cashlez/:id", TransactionController.deleteBill);
router.delete("/:id", TransactionController.remove);

module.exports = router;
