const router = require("express").Router();
const { authentication } = require("../middlewares/auth");

router.use(authentication);

module.exports = router;
