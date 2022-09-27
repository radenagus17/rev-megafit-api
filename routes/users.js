const router = require("express").Router();
const userController = require("../controllers/users");
const { uploadSingle } = require("../middlewares/multer");
const { authentication } = require("../middlewares/auth");

router.get("/", userController.findAll);
router.get("/forget-password", userController.forgetPassword);
router.get("/check", userController.check);
router.get("/check-token", authentication, userController.checkToken);
router.post("/signup", uploadSingle.single("avatar"), userController.signup);
router.post("/signin", userController.signin);
router.post("/import", authentication, uploadSingle.single("file"), userController.importExcel);
router.post("/trial", userController.homeTrial);
router.post("/invite-member", userController.inviteMember);
router.post("/generate-qr", userController.generateQR);
router.post("/freeze-member", uploadSingle.single("file"), userController.freezeMember);
router.post("/unfreeze", authentication, uploadSingle.single("file"), userController.unfreeze);
router.get("/:id", authentication, userController.findOne);
router.put("/:id", authentication, uploadSingle.single("file"), userController.update);
router.put("/data-member/:id", authentication, userController.updateDataMember);
router.put("/first-login/:id", userController.firstLogin);
router.put("/inactive-leave/:id", authentication, userController.inActiveLeave);
router.put("/reset-form-kesehatan/:id", authentication, userController.resetFormKesehatan);
router.delete("/delete", authentication, uploadSingle.single("file"), userController.delete);

module.exports = router;
