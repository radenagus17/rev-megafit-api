/**
 * @swagger
 * components:
 *    securitySchemes:
 *      TokenAuth:
 *        type: apiKey
 *        name: token
 *        in: header
 *      callbackToken:
 *        type: apiKey
 *        name: x-callback-token
 *        in: header
 *        description: (This auth just for xendit-callback)
 *
 *    schemas:
 *      Transactions:
 *        type: object
 *        properties:
 *          transactionId:
 *            type: integer
 *            description: the auto generated id of the user
 *          salesInvoice:
 *            type: string
 *            description: the auto generated id of the user
 *          methodPayment:
 *            type: string
 *            description: the auto generated id of the user
 *          memberId:
 *            type: integer
 *            description: the auto generated id of the user
 *          staffId:
 *            type: integer
 *            description: the auto generated id of the user
 *          amount:
 *            type: integer
 *            description: the auto generated id of the user
 *          admPrice:
 *            type: integer
 *            description: the auto generated id of the user
 *          status:
 *            type: string
 *            description: the auto generated id of the user
 *          namaRekening:
 *            type: string
 *            description: the auto generated id of the user
 *          bankAsal:
 *            type: string
 *            description: the auto generated id of the user
 *          keterangan:
 *            type: string
 *            description: the auto generated id of the user
 *          paymentDate:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          deniedReason:
 *            type: string
 *            description: the auto generated id of the user
 *          expiredAt:
 *            type: string
 *            format: date
 *            description: the auto generated id of the user
 *          namaPemilikKartu:
 *            type: string
 *            description: the auto generated id of the user
 *          bankKartu:
 *            type: string
 *            description: the auto generated id of the user
 *          bankTujuan:
 *            type: string
 *            description: the auto generated id of the user
 *          typeOfCard:
 *            type: string
 *            description: the auto generated id of the user
 *          lastDigit:
 *            type: string
 *            description: the auto generated id of the user
 *          namaDitransaksi:
 *            type: string
 *            description: the auto generated id of the user
 *          invoiceNumber:
 *            type: string
 *            description: the auto generated id of the user
 *          totalPayment:
 *            type: string
 *            description: the auto generated id of the user
 *          salesId:
 *            type: integer
 *            description: the auto generated id of the user
 *          cashierId:
 *            type: integer
 *            description: the auto generated id of the user
 *          inputMethod:
 *            type: string
 *            description: the auto generated id of the user
 *          xendit_url:
 *            type: string
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
 *   name: Transactions
 *   description: The Transaction managing API
 * /transaction:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Lists all the transactions
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: The list of the transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transactions'
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Created new transaction
 *     tags: [Transactions]
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               memberId:
 *                 type: integer
 *               amount:
 *                 type: integer
 *               packageMembershipId:
 *                 type: string
 *               categoryMembershipId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               leaveDate:
 *                 type: string
 *                 format: date
 *                 description: fill this column if member is cuti
 *     responses:
 *       201:
 *         description: Successful created new transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *                   example: transaction created
 *                 Data:
 *                   type: object
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /transaction/checkout:
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Checkout the transaction
 *     tags: [Transactions]
 *     requestBody:
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cart:
 *                 type: array
 *                 items:
 *                   type: object
 *               memberId:
 *                 type: integer
 *               salesId:
 *                 type: integer
 *               methodPayment:
 *                 type: string
 *               amount:
 *                 type: integer
 *               namaPemilikKartu:
 *                 type: string
 *               bankKartu:
 *                 type: string
 *               bankTujuan:
 *                 type: string
 *               typeOfCard:
 *                 type: string
 *               lastDigit:
 *                 type: string
 *               namaDiTransaksi:
 *                 type: string
 *               invoiceNumber:
 *                 type: string
 *               totalPayment:
 *                 type: string
 *               datePayment:
 *                 type: string
 *                 format: date
 *               namaRekening:
 *                 type: string
 *               onGoingTransactionId:
 *                 type: integer
 *               leaveDate:
 *                 type: string
 *                 format: date
 *             required:
 *               - memberId
 *               - methodPayment
 *     responses:
 *       200:
 *         description: Successfully checkout response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *                   example: Success Checkout Member !
 *                 invoice:
 *                   type: string
 *                   example: MPSI-00001234
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 * /transaction/invoice-xendit:
 *   post:
 *     security:
 *       - TokenAuth: []
 *     summary: Create invoice by xendit from the transaction
 *     tags: [Transactions]
 *     requestBody:
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: integer
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response create invoice from transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoice_url:
 *                   type: string
 *       401:
 *         description: Authorization information is missing or invalid.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 * /transaction/xendit-callback:
 *   post:
 *     security:
 *       - callbackToken: []
 *     summary: Routes for xendit callback
 *     tags: [Transactions]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               external_id:
 *                 type: integer
 *               status:
 *                 type: string
 *               payment_channel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response by xendit invoice
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *                   example: Success paid member !
 *       403:
 *         description: xendit header callback is not allowed
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Some server error
 *
 * /transaction/{id}:
 *   get:
 *     security:
 *       - TokenAuth: []
 *     summary: Get the transaction by transactionId
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 77
 *         description: The transactionId
 *       - in: query
 *         name: pos
 *         schema:
 *           type: string
 *           example: true
 *         description: Use this query if get from pos
 *       - in: query
 *         name: cashlez
 *         schema:
 *           type: string
 *           example: true
 *         description: Use this query if get from cashlez
 *     responses:
 *       200:
 *         description: Success response by transactionId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *     summary: Update the transaction by transactionId
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 77
 *         description: The transactionId
 *       - in: query
 *         name: transferred
 *         schema:
 *           type: string
 *           example: true
 *         description: Use this query if want update from transferred
 *       - in: query
 *         name: denied
 *         schema:
 *           type: string
 *           example: true
 *         description: Use this query if want update from denied
 *     requestBody:
 *        required: true
 *        content:
 *          application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               memberId:
 *                 type: integer
 *               transactionStatus:
 *                 type: string
 *                 example: denied
 *                 description: this request for query denied
 *               deniedReason:
 *                 type: string
 *                 description: this request for query denied
 *               paymentMethod:
 *                 type: string
 *                 example: TRANSFER
 *                 description: this request for query transferred
 *               namaDiTransaksi:
 *                 type: string
 *                 description: this request for query transferred
 *               invoiceNumber:
 *                 type: string
 *                 description: this request for query transferred
 *               totalPembayaran:
 *                 type: string
 *                 description: this request for query transferred
 *             required:
 *               - memberId
 *     responses:
 *       200:
 *         description: Successfully update response by transactionId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 *
 *   delete:
 *     security:
 *       - TokenAuth: []
 *     summary: Delete the transaction by id of orderList
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 77
 *         description: The orderList id
 *     responses:
 *       200:
 *         description: Successfully delete response by id of orderList
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Message:
 *                   type: string
 *                   example: Successfully deleted
 *       401:
 *         description: Authorization information is missing or invalid.
 *       500:
 *         description: Some server error
 */

const router = require("express").Router();
const { authentication } = require("../middlewares/auth");
const TransactionController = require("../controllers/transaction");

router.post("/xendit-callback", TransactionController.callbackXenditInvoice);
router.use(authentication);
router.get("/", TransactionController.findAll);
router.post("/", TransactionController.create);
router.post("/checkout", TransactionController.checkout);
router.post("/invoice-xendit", TransactionController.createXenditInvoice);
router.post("/email", TransactionController.emailResi);
router.get("/check-member/:id", TransactionController.check);
router.get("/:id", TransactionController.findOne);
router.put("/:id", TransactionController.update);
// router.put("/cashlez/:id", TransactionController.deleteBill);
router.delete("/:id", TransactionController.remove);

module.exports = router;
