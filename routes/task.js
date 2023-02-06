const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const taskController = require("../controllers/task");

router.use(authentication);

router.post("/", taskController.create);
router.post("/addFood", taskController.addFood);
router.get("/:ptId/:week", taskController.findPTTask);
router.put("/:id", taskController.updateStatus);

module.exports = router;
