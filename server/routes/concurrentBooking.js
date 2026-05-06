const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../middleware/errorHandler");
const ctrl = require("../controllers/concurrentBooking.controller");

router.get("/availability/:listingId", asyncHandler(ctrl.checkAvailability));
router.post("/intent", asyncHandler(ctrl.createIntent));
router.get("/intent/temp/:tempOrderId", asyncHandler(ctrl.getIntentByTempOrderId));
router.get("/intent/:intentId", asyncHandler(ctrl.getIntent));
router.post("/confirm/:intentId", asyncHandler(ctrl.confirmIntent));
router.delete("/intent/:intentId", asyncHandler(ctrl.cancelIntent));
router.put("/intent/:intentId/extend", asyncHandler(ctrl.extendLock));
router.get("/user/:customerId/listing/:listingId", asyncHandler(ctrl.getActiveIntent));

module.exports = router;
