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
 *      Users:
 *        type: object
 *        properties:
 *          userId:
 *            type: integer
 *            description: the auto generated id of the user
 *          username:
 *            type: string
 *            description: the auto generated id of the user
 *          fullname:
 *            type: string
 *            description: the auto generated id of the user
 *          nickname:
 *            type: string
 *            description: the auto generated id of the user
 *          avatar:
 *            type: string
 *            description: the auto generated id of the user
 *          notKtp:
 *            type: string
 *            description: the auto generated id of the user
 *          dateOfBirth:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          email:
 *            type: string
 *            description: the auto generated id of the user
 *          phone:
 *            type: string
 *            description: the auto generated id of the user
 *          gender:
 *            type: string
 *            description: the auto generated id of the user
 *          igAccount:
 *            type: string
 *            description: the auto generated id of the user
 *          roleId:
 *            type: integer
 *            description: the auto generated id of the user
 *          haveWhatsapp:
 *            type: boolean
 *            description: the auto generated id of the user
 *          flagActive:
 *            type: boolean
 *            description: the auto generated id of the user
 *          agreePromo:
 *            type: boolean
 *            description: the auto generated id of the user
 *          isDataConflict:
 *            type: boolean
 *            description: the auto generated id of the user
 *          firstLogin:
 *            type: boolean
 *            description: the auto generated id of the user
 *          OTP:
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
 *   name: Users
 *   description: The Users managing API
 * /users:
 *   get:
 *     summary: Lists all the users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of the users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Users'
 *
 * /users/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get the user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The userId
 *       - in: query
 *         name: idMember
 *         schema:
 *           type: integer
 *         required: false
 *         description: if find by memberId
 *     responses:
 *       200:
 *         description: The user response by userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  data:
 *                    type: object
 *       404:
 *         description: A user with the specified ID was not found.
 *
 * /users/pt:
 *   get:
 *     summary: Lists all the personal trainers
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The list of the personal trainers
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *
 *
 * /users/signin:
 *    post:
 *      summary: Login the user
 *      tags: [Users]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: password
 *             example:
 *               username: sumanto
 *               password: Abc12345
 *      responses:
 *        200:
 *          description: Takes this token and some data returned
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  token:
 *                    type: string
 *                  nickname:
 *                    type: string
 *                  fullname:
 *                    type: string
 *                  userId:
 *                    type: integer
 *                  roleId:
 *                    type: integer
 *        400:
 *          description: Username/Password is required
 *        500:
 *          description: some server error
 *
 * /users/signup:
 *    post:
 *      summary: Register the user
 *      tags: [Users]
 *      requestBody:
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               fullname:
 *                 type: string
 *               nickname:
 *                 type: string
 *               noKtp:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *                 format: email
 *               gender:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               phone:
 *                 type: string
 *             example:
 *               username: sumanto
 *               password: Abc12345
 *               fullname: Sumanto Genk
 *               nickname: suma
 *               noKtp: 91283039489
 *               dateOfBirth: 2000-05-30
 *               email: suma@mail.com
 *               gender: male
 *               roleId: 2
 *               phone: '08112392443'
 *
 *      responses:
 *        200:
 *          description: all data returned
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  data:
 *                    type: object
 *                    properties:
 *                      userId:
 *                        type: integer
 *                      username:
 *                        type: string
 *                      fullname:
 *                        type: string
 *                      ...:
 *                        type: string
 *                        example: '...'
 *
 *        409:
 *          description: if data username or email or no.hp is duplicate
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: username/email/no.hp salah
 *
 *        500:
 *          description: some server error
 *
 *
 */

const router = require("express").Router();
const userController = require("../controllers/users");
const { uploadSingle } = require("../middlewares/multer");
const { authentication } = require("../middlewares/auth");

router.get("/", userController.findAll);
router.get("/pt", userController.findAllPT);
router.get("/forget-password", userController.forgetPassword);
router.get("/check", userController.check);
router.get("/check-token", authentication, userController.checkToken);
router.get("/checkOTP", authentication, userController.checkOTP);
router.post("/signup", uploadSingle.single("avatar"), userController.signup);
router.post("/signin", userController.signin);
router.post(
  "/import",
  authentication,
  uploadSingle.single("file"),
  userController.importExcel
);
router.post("/trial", userController.homeTrial);
router.post("/invite-member", userController.inviteMember);
router.post("/generate-qr", userController.generateQR);
router.post(
  "/freeze-member",
  uploadSingle.single("file"),
  userController.freezeMember
);
router.post(
  "/unfreeze",
  authentication,
  uploadSingle.single("file"),
  userController.unfreeze
);
router.get("/:id", authentication, userController.findOne);
router.put(
  "/:id",
  authentication,
  uploadSingle.single("file"),
  userController.update
);
router.put("/data-member/:id", authentication, userController.updateDataMember);
router.put("/first-login/:id", userController.firstLogin);
router.put("/inactive-leave/:id", authentication, userController.inActiveLeave);
router.put(
  "/reset-form-kesehatan/:id",
  authentication,
  userController.resetFormKesehatan
);
router.delete(
  "/delete",
  authentication,
  uploadSingle.single("file"),
  userController.delete
);

module.exports = router;
