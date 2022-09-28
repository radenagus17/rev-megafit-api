const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const packageMembershipController = require("../controllers/packageMembership");

router.get("/", packageMembershipController.findAll);
router.use(authentication);
router.post("/", packageMembershipController.create);
router.get("/:id", packageMembershipController.findOne);
router.put("/:id", packageMembershipController.update);
router.delete("/:id", packageMembershipController.delete);

module.exports = router;
