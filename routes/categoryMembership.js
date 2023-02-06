const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const categoryMembershipController = require("../controllers/categoryMembership");

router.use(authentication);
router.get("/", categoryMembershipController.findAll);

module.exports = router;
