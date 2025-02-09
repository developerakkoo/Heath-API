const ErrorHandler = require("../utils/ErrorHandling");
const tryCatchError = require("../middleware/tryCatch");
const Voucher = require("../models/voucherModels");

// create Voucher..
exports.createVoucher = tryCatchError(async (req, res, next) => {
  const { title, description, discount, expiryDate } = req.body;
  const createVoucher = new Voucher({
    title,
    description,
    discount,
    expiryDate,
  });
  await createVoucher.save();

  res.status(200).json({
    success: true,
    message: "Voucher created",
    voucher: createVoucher,
  });
});

// update voucher..
exports.updateVoucher = tryCatchError(async (req, res, next) => {
  const { title, description, discount, expiryDate } = req.body;

  const voucher = await Voucher.findById(req.params.id);
  if (voucher) {
    return next(new ErrorHandler("Voucher not found", 404));
  }

  voucher.title = title || voucher.title;
  voucher.description = description || voucher.description;
  voucher.discount = discount || voucher.discount;
  voucher.expiryDate = expiryDate || voucher.expiryDate;
  voucher.status = status || voucher.status;

  res.status(200).json({
    success: true,
    message: "Voucher updated",
  });
});

// delete voucher..
exports.deleteVoucher = tryCatchError(async (req, res, next) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);
  if (voucher) {
    return next(new ErrorHandler("Voucher not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Voucher deleted successfuly",
  });
});

// get all voucher..
exports.getVoucher = tryCatchError(async (req, res, next) => {
  const vouchers = await Voucher.find();
  res.status(200).json({
    success: true,
    vouchers,
  });
});

