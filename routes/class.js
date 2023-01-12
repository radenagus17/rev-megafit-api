const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const classController = require("../controllers/classes");

router.use(authentication);
router.post("/", classController.create);
router.get("/", classController.findAll);
router.put("/join/:id", classController.joinClass);
router.put("/cancel-join/:id", classController.cancelJoinClass);
router.get("/:id", classController.findOne);
router.put("/:id", classController.update);
router.delete("/:id", classController.delete);

module.exports = router;
