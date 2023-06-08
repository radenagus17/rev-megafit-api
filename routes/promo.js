/**
 * @swagger
 * components:
 *    securitySchemes:
 *      TokenAuth:
 *        type: apiKey
 *        name: token
 *        in: header
 *
 *    responses:
 *      NotFound:
 *       description: The specified resource was not found
 *      content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/Error'
 *
 *    schemas:
 *      Error:
 *        type: object
 *        properties:
 *          success:
 *            type: boolean
 *            example: false
 *          message:
 *            type: string
 *            example: Data Not Found
 *
 *      Promo:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *            description: the auto generated id of the promo
 *          name:
 *            type: string
 *            description: the auto generated id of the promo
 *          code:
 *            type: string
 *            description: the auto generated id of the promo
 *          poster:
 *            type: string
 *            description: the auto generated id of the promo
 *          periodeStart:
 *            type: string
 *            format: date
 *            description: the auto generated id of the promo
 *          periodeEnd:
 *            type: string
 *            format: date
 *            description: the auto generated id of the promo
 *          typeVoucher:
 *            type: string
 *            description: the auto generated id of the promo
 *          discountMax:
 *            type: integer
 *            description: the auto generated id of the promo
 *          minimumPurchase:
 *            type: integer
 *            description: the auto generated id of the promo
 *          usageQuota:
 *            type: integer
 *            description: the auto generated id of the promo
 *          forAll:
 *            type: boolean
 *            description: the auto generated id of the promo
 *          nominal:
 *            type: integer
 *            description: the auto generated id of the promo
 *          keterangan:
 *            type: string
 *            description: the auto generated id of the promo
 *          canCombine:
 *            type: boolean
 *            description: the auto generated id of the promo
 *          isUnlimited:
 *            type: boolean
 *            description: the auto generated id of the promo
 *          createdAt:
 *            type: string
 *            format: date
 *            description: the auto generated id of the promo
 *          updateAt:
 *            type: string
 *            format: date
 *            description: the auto generated id of the promo
 */

/**
 * @swagger
 * tags:
 *   name: Promo
 *   description: The Promo managing API
 * /promo:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the promos
 *     tags: [Promo]
 *     responses:
 *       200:
 *         description: The list of the promos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Promo'
 *       401:
 *         description: Authorization information is missing or invalid.
 *
 * /promo/voucher:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the history promo of member (auth= member)
 *     tags: [Promo]
 *     responses:
 *       200:
 *         description: The list of the history promo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: boolean
 *                  histories:
 *                    type: array
 *                    items:
 *                      type: object
 *
 *       401:
 *         description: Authorization information is missing or invalid.
 *
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Take the voucher for member (auth= member)
 *     tags: [Promo]
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully taken the voucher for member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  Message:
 *                    type: string
 *                    example: Success Add Promo !
 *                  Code_Voucher:
 *                    type: string
 *
 *       401:
 *         description: Authorization information is missing or invalid.
 *       403:
 *         description: Quota runs out - you cannot claim promo 2 times - max 2 different promo in a day
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Transaction Order is less than minimum promo !
 *
 * /promo/create:
 *    post:
 *      security:
 *       - TokenAuth: []
 *      summary: Add new promo
 *      tags: [Promo]
 *      requestBody:
 *        content:
 *          multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: poster upload from this
 *               periodeStart:
 *                 type: string
 *                 format: date
 *               periodeEnd:
 *                 type: string
 *                 format: date
 *               typeVoucher:
 *                 type: string
 *               discountMax:
 *                 type: integer
 *               minimumPurchase:
 *                 type: integer
 *               usageQuota:
 *                 type: integer
 *               forAll:
 *                 type: boolean
 *               nominal:
 *                 type: integer
 *               canCombine:
 *                 type: boolean
 *               isUnlimited:
 *                 type: boolean
 *               product:
 *                 type: array
 *                 description: if column forAll false then this column will be use
 *      responses:
 *        201:
 *          description: Successful add new promo
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  getOne:
 *                    type: object
 *
 *        401:
 *          description: Authorization information is missing or invalid.
 *
 *        403:
 *          description: if column product add more than 3 product
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: You can't add product more than 3
 *
 *        409:
 *          description: if code voucher is duplicated
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: conflict code voucher
 *                  code:
 *                    type: string
 *        500:
 *          description: some server error
 *
 * /promo/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get the promo by id
 *     tags: [Promo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The promo id
 *     responses:
 *       200:
 *         description: The promo response by id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 code:
 *                   type: string
 *                 ...:
 *                   type: string
 *                   example: ...
 *       401:
 *         description: missing access token.
 *
 *
 *   put:
 *     security:
 *       - TokenAuth: []
 *     summary: Update the promo by id
 *     tags: [Promo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The promo id
 *     requestBody:
 *        content:
 *          multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: poster upload from this
 *               periodeStart:
 *                 type: string
 *                 format: date
 *               periodeEnd:
 *                 type: string
 *                 format: date
 *               typeVoucher:
 *                 type: string
 *               discountMax:
 *                 type: integer
 *               minimumPurchase:
 *                 type: integer
 *               usageQuota:
 *                 type: integer
 *               forAll:
 *                 type: boolean
 *               nominal:
 *                 type: integer
 *               canCombine:
 *                 type: boolean
 *               isUnlimited:
 *                 type: boolean
 *               product:
 *                 type: array
 *                 description: if column forAll false then this column will be use
 *     responses:
 *       200:
 *          description: Successful update exciting promo
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  getOne:
 *                    type: object
 *
 *       401:
 *          description: missing access token
 *
 *       403:
 *          description: if column product add more than 3 product
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: You can't add product more than 3
 *
 *       409:
 *          description: if code voucher is duplicated
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: conflict code voucher
 *                  code:
 *                    type: string
 *       500:
 *          description: some server error
 *
 *   delete:
 *     security:
 *       - TokenAuth: []
 *     summary: Delete the promo by id
 *     tags: [Promo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The promo id
 *     responses:
 *       200:
 *         description: The delete promo response by id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *                 deleted:
 *                   type: integer
 *                   example: 11
 *       401:
 *         description: missing access token.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: some server error
 *
 * /promo/voucher/{id}:
 *   delete:
 *     security:
 *       - TokenAuth: []
 *     summary: Cancel promo by historyId of member (auth= member)
 *     tags: [Promo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The historyPromo id
 *     responses:
 *       200:
 *         description: The list of the history promo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: boolean
 *                  message:
 *                    type: string
 *                    example: resource canceled successfully for historyId 12
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         description: ~if params id invalid ~if claimDate has passed ~if order transaction is null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: Data Not Found
 *       500:
 *         description: some server error
 *
 */

const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const { uploadSingle } = require("../middlewares/multer");
const promoController = require("../controllers/promo");

router.use(authentication);
router.get("/", promoController.findAll);
//todo: member start
router.get("/voucher", promoController.historyMemberVoucher);
router.get("/:id", promoController.findOne);
router.post("/create", uploadSingle.single("file"), promoController.create);
//todo: member start
router.post("/voucher", promoController.takeVoucher);
//todo: member end
router.put("/:id", uploadSingle.single("file"), promoController.edit);
router.delete("/:id", promoController.delete);
//todo: member
router.delete("/voucher/:id", promoController.cancelVoucher);

module.exports = router;
