const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const historyClassController = require("../controllers/historyClass");

router.use(authentication);
// router.post("/", classPtController.create);
router.get("/", historyClassController.findAll);
// router.put("/join/:id", classPtController.joinClass);
// router.put("/cancelJoin/:id", classPtController.cancelJoinClass);
// router.get("/:id", classPtController.findOne);
// router.put("/:id", classPtController.update);
// router.delete("/:id", classPtController.delete);

module.exports = router;
