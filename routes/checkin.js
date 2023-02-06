const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const checkinController = require("../controllers/checkin");

router.use(authentication);

router.post("/", checkinController.create);
router.get("/", checkinController.findAll);
router.put("/:id", checkinController.update);
router.delete("/:id", checkinController.delete);

module.exports = router;
