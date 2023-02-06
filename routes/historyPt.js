const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const historyPtController = require("../controllers/historyPt");

router.use(authentication);
router.get("/", historyPtController.findAll);
router.get("/:id", historyPtController.findOne);
router.put("/:id", historyPtController.update);
router.delete("/:id", historyPtController.delete);

module.exports = router;
