const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const subCategoryMembershipController = require("../controllers/subCategoryMembership");

router.get("/", subCategoryMembershipController.findAll);
router.use(authentication);
router.post("/", subCategoryMembershipController.create);
router.get("/main-package", subCategoryMembershipController.findMainPackage);
router.get("/:id", subCategoryMembershipController.findOne);
router.put("/:id", subCategoryMembershipController.update);
router.delete("/:id", subCategoryMembershipController.delete);

module.exports = router;
