const router = require("express").Router();
const userRoute = require("./users");
const promoRoute = require("./promo");
const errorHandler = require("../middlewares/errorHandler");

router.get("/", (req, res) => {
  res.send("welcome to megafit");
});

router.use("/users", userRoute);
router.use("/promo", promoRoute);
router.use(errorHandler);

module.exports = router;
