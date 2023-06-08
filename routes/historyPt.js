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
 *      HistoryPT:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *            description: the auto generated id of the user
 *          userId:
 *            type: integer
 *            description: the auto generated id of the user
 *          classPtId:
 *            type: integer
 *            description: the auto generated id of the user
 *          catatan:
 *            type: string
 *            description: the auto generated id of the user
 *          hasJoined:
 *            type: boolean
 *            description: the auto generated id of the user
 *          PTCommission:
 *            type: integer
 *            description: the auto generated id of the user
 *          revenueId:
 *            type: integer
 *            description: the auto generated id of the user
 *          createdAt:
 *            type: string
 *            format: timestamp
 *            description: the auto generated id of the user
 *          updatedAt:
 *            type: string
 *            format: timestamp
 *            description: the auto generated id of the user
 */

/**
 * @swagger
 * tags:
 *   name: HistoryPT
 *   description: The HistoryPT managing API
 * /history-pts:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the historyPT members
 *     tags: [HistoryPT]
 *     parameters:
 *       - in: query
 *         name: hasPassed
 *         schema:
 *           type: string
 *         description: if query hasPassed true
 *       - in: query
 *         name: checkin
 *         schema:
 *           type: string
 *         description: if query checkin true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: if query date
 *       - in: query
 *         name: laporan
 *         schema:
 *           type: string
 *         description: if query laporan true
 *       - in: query
 *         name: schedule
 *         schema:
 *           type: string
 *         description: if query schedule true
 *     responses:
 *       200:
 *         description: The list of the historyPT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 totalRecord:
 *                   type: integer
 *                   example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /history-pts/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get the historyPT member by id
 *     tags: [HistoryPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The historyPT id
 *     responses:
 *       200:
 *         description: Response back data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Update the historyPT member by id
 *     tags: [HistoryPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The historyPT id
 *     requestBody:
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               catatan:
 *                 type: string
 *               hasJoined:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Response back data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 *   delete:
 *     security:
 *       - TokenAuth: []
 *     summary: Cancel class by historyPTId of member
 *     tags: [HistoryPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The historyPT id
 *     responses:
 *       200:
 *         description: Response back data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 idDeleted:
 *                   type: integer
 *                   example: 7
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 */

const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const historyPtController = require("../controllers/historyPt");

router.use(authentication);
router.get("/", historyPtController.findAll);
router.get("/:id", historyPtController.findOne);
router.put("/:id", historyPtController.update);
router.delete("/:id", historyPtController.delete);

module.exports = router;
