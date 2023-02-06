const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const classPtController = require("../controllers/classPt");

router.use(authentication);
router.post("/", classPtController.create);
router.get("/", classPtController.findAll);
router.put("/join/:id", classPtController.joinClass);
router.put("/cancelJoin/:id", classPtController.cancelJoinClass);
router.get("/:id", classPtController.findOne);
router.put("/:id", classPtController.update);
router.delete("/:id", classPtController.delete);

module.exports = router;
