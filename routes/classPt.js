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
 *      ClassPT:
 *        type: object
 *        properties:
 *          classPtId:
 *            type: integer
 *            description: the auto generated id of the user
 *          ptId:
 *            type: integer
 *            description: the auto generated id of the user
 *          time:
 *            type: string
 *            format: time
 *            description: the auto generated id of the user
 *          date:
 *            type: integer
 *            description: the auto generated id of the user
 *          week:
 *            type: integer
 *            description: the auto generated id of the user
 *          month:
 *            type: integer
 *            description: the auto generated id of the user
 *          year:
 *            type: integer
 *            description: the auto generated id of the user
 *          linkZoom:
 *            type: string
 *            description: the auto generated id of the user
 *          isOnline:
 *            type: boolean
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
 *   name: ClassPT
 *   description: The ClassPT managing API
 * /class-pts:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the classPT
 *     tags: [ClassPT]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           example: true
 *         description: if query all true
 *       - in: query
 *         name: by_date
 *         schema:
 *           type: string
 *           example: true
 *         description: if query by_date true
 *       - in: query
 *         name: hour
 *         schema:
 *           type: string
 *           format: time
 *           example: 11:00:00
 *         description: Search by hour of time
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: 2023-06-06
 *         description: Search by date
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           example: 12345
 *         description: Search by id of ptId user
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *           example: 12
 *         description: Search by week of tblClassPts
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2023
 *         description: Search by year of tblClassPts
 *     responses:
 *       200:
 *         description: The list of the classPTs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 totalRecord:
 *                   type: integer
 *                   example: 11
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClassPT'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Add new classPT
 *     tags: [ClassPT]
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               time:
 *                 type: string
 *                 format: time
 *               date:
 *                 type: integer
 *                 example: 15
 *               week:
 *                 type: integer
 *                 example: 9
 *               month:
 *                 type: integer
 *                 example: 6
 *               year:
 *                 type: integer
 *                 example: 2023
 *               isOnline:
 *                 type: boolean
 *                 example: false
 *             required:
 *               - time
 *               - date
 *               - week
 *               - month
 *               - year
 *     responses:
 *       201:
 *          description: Response after successful create classPt
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: Schedule has on
 *       500:
 *         description: Some server error
 *
 * /class-pts/join/{id}:
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Join classPT for member (auth=member)
 *     tags: [ClassPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The classPtId
 *     responses:
 *       200:
 *          description: successfully member join classPT
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   $ref: '#/components/schemas/HistoryPT'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: PTSession is null
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 * /class-pts/cancelJoin/{id}:
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Cancel join classPT for member (auth=member)
 *     tags: [ClassPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The id of historyPT
 *     responses:
 *       200:
 *          description: successfully member cancel classPT
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 isDeleted:
 *                   type: integer
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /class-pts/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get one classPt
 *     tags: [ClassPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The classPtId
 *     responses:
 *       200:
 *          description: Successfully get one classPt
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
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
 *     summary: Update one classPt
 *     tags: [ClassPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The classPtId
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               linkZoom:
 *                 type: string
 *     responses:
 *       200:
 *          description: Successfully update one classPt
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
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
 *     summary: Delete one classPt
 *     tags: [ClassPT]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The classPtId
 *     responses:
 *       200:
 *          description: Successfully delete one classPt
 *          content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type:
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 */

const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const classPtController = require("../controllers/classPt");

router.use(authentication);
router.post("/", classPtController.create);
router.get("/", classPtController.findAll);
router.put("/join/:id", classPtController.joinClass);
router.put("/cancelJoin/:id", classPtController.cancelJoinClass);
router.get("/:id", classPtController.findOne);
router.put("/:id", classPtController.update);
router.delete("/:id", classPtController.delete);

module.exports = router;
