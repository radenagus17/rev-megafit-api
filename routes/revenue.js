/**
 * @swagger
 * components:
 *    securitySchemes:
 *      TokenAuth:
 *        type: apiKey
 *        name: token
 *        in: header
 *
 *    schemas:
 *      Revenue:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *            description: the auto generated id of the user
 *          memberId:
 *            type: integer
 *            description: the auto generated id of the user
 *          dateActiveMembership:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          activeMembershipExpired:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          keterangan:
 *            type: string
 *            description: the auto generated id of the user
 *          status:
 *            type: string
 *            description: the auto generated id of the user
 *          packageBefore:
 *            type: string
 *            description: the auto generated id of the user
 *          packageAfter:
 *            type: string
 *            description: the auto generated id of the user
 *          times:
 *            type: integer
 *            description: the auto generated id of the user
 *          debit:
 *            type: integer
 *            description: the auto generated id of the user
 *          kredit:
 *            type: integer
 *            description: the auto generated id of the user
 *          saldo_member:
 *            type: integer
 *            description: the auto generated id of the user
 *          pending_saldo:
 *            type: integer
 *            description: the auto generated id of the user
 *          price:
 *            type: integer
 *            description: the auto generated id of the user
 *          is_event:
 *            type: boolean
 *            description: the auto generated id of the user
 *          last_kredited:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          dateActivePT:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          activePtExpired:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          packagePT:
 *            type: string
 *            description: the auto generated id of the user
 *          timesPT:
 *            type: integer
 *            description: the auto generated id of the user
 *          PTTerpakai:
 *            type: integer
 *            description: the auto generated id of the user
 *          isDone:
 *            type: boolean
 *            description: the auto generated id of the user
 *          pricePT:
 *            type: integer
 *            description: the auto generated id of the user
 *          createdAt:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          updatedAt:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 */

/**
 * @swagger
 * tags:
 *   name: Revenue
 *   description: The Revenue managing API
 * /revenue:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the revenue
 *     tags: [Revenue]
 *     responses:
 *       200:
 *         description: The list of the revenues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 membership:
 *                   type: array
 *                   items:
 *                     type: object
 *                 detailMembership:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pt:
 *                   type: array
 *                   items:
 *                     type: object
 *                 detailPT:
 *                   type: array
 *                   items:
 *                     type: object
 *                 cuti:
 *                   type: array
 *                   items:
 *                     type: object
 *                 adminFee:
 *                   type: array
 *                   items:
 *                     type: object
 *                 product:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalRevenueMembership:
 *                   type: integer
 *                 totalRevenuePT:
 *                   type: integer
 *                 totalRevenueCUTI:
 *                   type: integer
 *                 totalRevenueAdminFee:
 *                   type: integer
 *                 totalRevenueProduct:
 *                   type: integer
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /revenue/transferRevenue:
 *   patch:
 *     security:
 *       - TokenAuth: []
 *     summary: Transfer revenue package membership or package PT
 *     tags: [Revenue]
 *     parameters:
 *       - in: query
 *         name: member_1
 *         schema:
 *           type: integer
 *         required: true
 *         description: The person_1 memberId
 *       - in: query
 *         name: member_2
 *         schema:
 *           type: integer
 *         required: true
 *         description: The person_2 memberId
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               transfer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful transfer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: ~package membership expired ~request transfer is null ~member is cuti ~PTSession is done
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 */

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
