const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/multer");
const promoController = require("../controllers/promo");

router.use(authentication);
router.get("/", promoController.findAll);
router.get("/:id", promoController.findOne);
router.post("/create", uploadSingle.single("file"), promoController.create);
router.put("/:id", uploadSingle.single("file"), promoController.edit);
router.delete("/:id", promoController.delete);

module.exports = router;
