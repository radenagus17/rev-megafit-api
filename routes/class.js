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
 *      Class:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *            description: the auto generated id of the user
 *          ptId:
 *            type: integer
 *            description: the auto generated id of the user
 *          timeIn:
 *            type: string
 *            format: time
 *            description: the auto generated id of the user
 *          timeOut:
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
 *          color:
 *            type: string
 *            description: the auto generated id of the user
 *          subCategoryMembershipId:
 *            type: integer
 *            description: the auto generated id of the user
 *          limit:
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
 *   name: Class
 *   description: The Class managing API
 * /classes:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the class
 *     tags: [Class]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           example: true
 *         description: if query all true
 *       - in: query
 *         name: only
 *         schema:
 *           type: string
 *           example: name
 *         description: if query only name
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           example: true
 *         description: if query active true
 *       - in: query
 *         name: class-megafit
 *         schema:
 *           type: string
 *           example: true
 *         description: if query class-megafit true
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           example: 7
 *         description: if query all true use this query too
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *           example: 2023
 *         description: if query all true use this query too
 *     responses:
 *       200:
 *         description: The list of the class
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
 *                     $ref: '#/components/schemas/Class'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Add new class
 *     tags: [Class]
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               subCategoryMembershipId:
 *                 type: integer
 *               ptId:
 *                 type: integer
 *               timeIn:
 *                 type: string
 *                 example: 10:00:00
 *               timeOut:
 *                 type: string
 *                 example: 11:00:00
 *               date:
 *                 type: integer
 *               week:
 *                 type: integer
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               color:
 *                 type: string
 *               linkZoom:
 *                 type: string
 *               limit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Successfully add new class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /classes/join/{id}:
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Member join class API (auth=member)
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The Class id
 *     responses:
 *       200:
 *         description: Successfully member join one class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: ~Slot full ~Membership expired
 *       409:
 *         description: This class is not yet available, check the date
 *       500:
 *         description: Some server error
 *
 * /classes/cancel-join/{id}:
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Member cancel join class API (auth=member)
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The HistoryClass id
 *     responses:
 *       200:
 *         description: Successfully member cancel-join the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 idDeleted:
 *                   type: integer
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: Membership expired
 *       409:
 *         description: This class is not yet available, check the date
 *       500:
 *         description: Some server error
 *
 * /classes/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get one the class
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The Class id
 *     responses:
 *       200:
 *         description: Response get one class
 *         content:
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
 *       500:
 *         description: Some server error
 *
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Update one of class
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The Class id
 *       - in: query
 *         name: edit
 *         schema:
 *           type: string
 *         description: example query edit = class or query edit = pt
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               permanent:
 *                 type: string
 *                 example: true
 *                 description: this Column use form query edit = pt
 *               userId:
 *                 type: integer
 *                 description: this Column use form query edit = pt
 *               classDate:
 *                 type: integer
 *                 description: this Column use form query edit = pt
 *               subCategoryMembershipId:
 *                 type: integer
 *               ptId:
 *                 type: integer
 *               timeIn:
 *                 type: string
 *                 example: 10:00:00
 *               timeOut:
 *                 type: string
 *                 example: 11:00:00
 *               date:
 *                 type: integer
 *               week:
 *                 type: integer
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               color:
 *                 type: string
 *               linkZoom:
 *                 type: string
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Response update one class
 *         content:
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
 *     summary: Delete one of class
 *     tags: [Class]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: The Class id
 *     responses:
 *       200:
 *         description: Response after delete one class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 idDeleted:
 *                   type: integer
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 */

const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const classController = require("../controllers/classes");

router.use(authentication);
router.post("/", classController.create);
router.get("/", classController.findAll);
router.put("/join/:id", classController.joinClass);
router.put("/cancel-join/:id", classController.cancelJoinClass);
router.get("/:id", classController.findOne);
router.put("/:id", classController.update);
router.delete("/:id", classController.delete);

module.exports = router;
