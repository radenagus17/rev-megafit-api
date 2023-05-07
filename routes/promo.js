const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/multer");
const promoController = require("../controllers/promo");

router.use(authentication);
router.get("/", promoController.findAll);
//todo: member start
router.get("/voucher", promoController.historyMemberVoucher);
router.get("/:id", promoController.findOne);
router.post("/create", uploadSingle.single("file"), promoController.create);
//todo: member start
router.post("/voucher", promoController.takeVoucher);
//todo: member end
router.put("/:id", uploadSingle.single("file"), promoController.edit);
router.delete("/:id", promoController.delete);
//todo: member
router.delete("/voucher/:id", promoController.cancelVoucher);

module.exports = router;
