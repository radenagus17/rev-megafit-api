const route = require("express").Router();
const { authentication } = require("../middlewares/auth");
const RevenueController = require("../controllers/revenue");
const { uploadSingle } = require("../middlewares/multer");

route.use(authentication);
route.get("/", RevenueController.findAll);
route.post(
  "/import",
  uploadSingle.single("file"),
  RevenueController.importExcel
);
route.post(
  "/importPt",
  uploadSingle.single("file"),
  RevenueController.importPt
);
route.post(
  "/promo",
  uploadSingle.single("file"),
  RevenueController.promoNovember
);
route.post(
  "/updateHistoryPT",
  uploadSingle.single("file"),
  RevenueController.updateHistoryPT
);
route.post(
  "/updateRevenue",
  uploadSingle.single("file"),
  RevenueController.updateRevenue
);
route.patch("/transferRevenue", RevenueController.transferRevenue);

module.exports = route;
