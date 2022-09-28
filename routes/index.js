const router = require("express").Router();
const userRoute = require("./users");
const promoRoute = require("./promo");
const packageMembershipRoute = require("./packageMembership");
const subCategoryMembershipRoute = require("./subCategoryMembership");
const categoryMembershipRoute = require("./categoryMembership");
const errorHandler = require("../middlewares/errorHandler");

router.get("/", (req, res) => {
  res.send("welcome to megafit");
});

router.use("/users", userRoute);
router.use("/promo", promoRoute);
router.use("/package-memberships", packageMembershipRoute);
router.use("/sub-category-memberships", subCategoryMembershipRoute);
router.use("/category-memberships", categoryMembershipRoute);
router.use(errorHandler);

module.exports = router;
