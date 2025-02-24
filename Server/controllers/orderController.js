const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const Medicine = require("../models/medicineModel");
const Order = require("../models/orderModel");
const UserProfile = require("../models/userProfile");
const Voucher = require("../models/voucherModels")

// new Order..
exports.newOrder = tryCatch(async (req, res, next) => {
  const { address, orderItems, paymentInfo, deliveryOption } = req.body;

  if (!req.user || !req.user._id) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }

  const userProfile = await UserProfile.findOne({ user: req.user._id });
  if (!userProfile) {
    return next(new ErrorHandler("User profile not found", 404));
  }

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return next(new ErrorHandler("Order items are required", 400));
  }

  let enrichedOrderItems = [];

  for (const item of orderItems) {
    const product = await Medicine.findById(item.product);
    if (!product) {
      return next(new ErrorHandler(`Product not found: ${item.product}`, 404));
    }

    // Check stock availability
    if (product.stock < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for ${product.name}`, 400));
    }

    // Reduce stock
    product.stock -= item.quantity;
    await product.save({ validateBeforeSave: false });

    enrichedOrderItems.push({ ...item, category: product.category });
  }

  // Validate delivery option
  const firstProduct = await Medicine.findById(orderItems[0].product);
  if (!firstProduct) return next(new ErrorHandler("Invalid product for delivery option", 400));

  const selectedDeliveryOption = firstProduct.deliveryOptions?.[deliveryOption];
  if (!selectedDeliveryOption) {
    return next(new ErrorHandler("Invalid delivery option", 400));
  }

  const shippingPrice = selectedDeliveryOption.price;
  const itemTotalPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalPrice = itemTotalPrice + shippingPrice;

  // Create Order
  const order = await Order.create({
    address: userProfile._id,
    orderItems: enrichedOrderItems,
    user: userProfile._id,
    paymentInfo,
    itemPrice: itemTotalPrice,
    shippingPrice,
    deliveryOption: selectedDeliveryOption,
    totalPrice,
    paidAt: Date.now(),
  });

  return res.status(201).json({
    success: true,
    message: "Order placed successfully!",
    order,
  });
});

// Cancle Order.
exports.cancelOrder = tryCatch(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Cancelled") {
    return next(new ErrorHandler("This order is already cancelled", 400));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You cannot cancel a delivered order", 400));
  }

  // Restore stock
  for (const item of order.orderItems) {
    await updateStock(item.product, -item.quantity);
  }

  // Update order status to "Cancelled"
  order.orderStatus = "Cancelled";
  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully, stock restored.",
  });
});
// Helper Function to update Stock..
async function updateStock(id, quantity) {
  const product = await Medicine.findById(id);
  if (!product) {
    throw new ErrorHandler("Product not found", 404);
  }

  product.stock += quantity; // Restores stock if quantity is negative
  await product.save({ validateBeforeSave: false });
}

// get Single order By Id..
exports.getSingleOrder = tryCatch(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate({
    path: "user", // Populate from UserProfile
    populate: { path: "user", model: "PhoneUser", select: "phone" },
    select: "personalInformation.fullName personalInformation.address",
  });

  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }

  if (!order.user) {
    return next(new ErrorHandler("User profile not found for this order", 404));
  }

  res.status(200).json({
    success: true,
    userName: order.user.personalInformation?.fullName || "No name available",
    userAddress:
      order.user.personalInformation?.address || "No address available",
    userPhone: order.user.user?.phone || "No phone available",
  });
});

// Get logged in user orders..
exports.myOrders = tryCatch(async (req, res, next) => {
  const userProfile = await UserProfile.findOne({ user: req.user._id });

  if (!userProfile) {
    return next(new ErrorHandler("User profile not found", 404));
  }

  // Now fetch orders using UserProfile ID
  const orders = await Order.find({ user: userProfile._id });

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// Admin get all Orders - Admin..
// exports.getAllOrders = tryCatch(async(req,res,next) =>{
//   const orders = await Order.find().populate({
//     path: "user", // Populate from UserProfile
//     populate: { path: "user", model: "PhoneUser", select: "phone" },
//     select: "personalInformation.fullName personalInformation.address",
//   });
//   let totalAmount = 0;
//   orders.forEach((order) =>{
//     totalAmount += order.totalPrice;
//   })
//   res.status(200).json({
//     success:true,
//     orders,
//     totalAmount,
//   })
// })

// Update order status -- Admin..
exports.updateOrderStatus = tryCatch(async(req,res,next) =>{
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400)); // Better error code
  }

  // Update stock for each product in the order
  for (const item of order.orderItems) {
    await updateStock(item.product, item.quantity);
  }

  // Update order status
  order.orderStatus = req.body.status; // Correct assignment

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
  });
});
// Helper function to update product stock
async function updateStock(id, quantity) {
  const product = await Medicine.findById(id);
  if (!product) {
    throw new ErrorHandler("Product not found", 404);
  }
  if (product.stock < quantity) {
    throw new ErrorHandler("Insufficient stock for product", 400);
  }
  product.stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// Delete Order -- Admin..
exports.deleteOrder = tryCatch(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// get Income Statistics..
exports.getIncomeStatistics = tryCatch(async (req, res, next) => {
  const { year, month, day } = req.query;

  if (!year) {
    return next(new ErrorHandler("Year is required to fetch income", 400));
  }

  const yearFilter = parseInt(year);
  const monthFilter = month ? parseInt(month) - 1 : null; // Convert to 0-indexed
  const dayFilter = day ? parseInt(day) : null;

  // Prepare date ranges for each level of granularity
  const startDateYear = new Date(yearFilter, 0, 1);
  const endDateYear = new Date(yearFilter + 1, 0, 1);

  const startDateMonth = new Date(yearFilter, monthFilter ?? 0, 1);
  const endDateMonth = new Date(yearFilter, monthFilter + 1 ?? 12, 1);

  const startDateDay = new Date(yearFilter, monthFilter ?? 0, dayFilter ?? 1);
  const endDateDay = new Date(yearFilter, monthFilter ?? 0, dayFilter + 1 ?? 2);

  // Aggregation pipeline for Yearly, Monthly, and Daily income
  const yearlyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateYear, $lt: endDateYear },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const monthlyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateMonth, $lt: endDateMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const dailyIncome = await Order.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: { $gte: startDateDay, $lt: endDateDay },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$totalPrice" },
        averageIncome: { $avg: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    income: {
      yearlyIncome: yearlyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
      monthlyIncome: monthlyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
      dailyIncome: dailyIncome[0] || {
        totalIncome: 0,
        averageIncome: 0,
        orderCount: 0,
      },
    },
  });
});

//  Fetch Order History by Categories (MyActivity)..
exports.getOrderHistoryByCategory = tryCatch(async (req, res, next) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return next(
      new ErrorHandler("Year and month are required to fetch order history", 400)
    );
  }

  // Convert month to 0-indexed format
  const startDate = new Date(year, month - 1, 1); // Start of the month
  const endDate = new Date(year, month, 1); // Start of the next month

  // Get the corresponding UserProfile ID for this PhoneUser
  const userProfile = await UserProfile.findOne({ user: req.user._id });

  if (!userProfile) {
    return next(new ErrorHandler("User profile not found", 404));
  }

 // Fetch orders using the correct user ID
  const orders = await Order.find({
    user: userProfile._id,
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  if (!orders.length) {
    return res.status(404).json({ message: `No orders found for ${month}/${year}` });
  }

  const categorySummary = {};
  let totalAmount = 0;
  let totalOrders = 0;
  let totalProcessingOrders = 0;

  // Group items by category
  orders.forEach((order) => {
    totalOrders++;
    if (order.orderStatus === "Processing") {
      totalProcessingOrders++;
    }

    order.orderItems.forEach((item) => {
      if (!item || !item.category) return; // Skip null or undefined items
      const { category, price, quantity } = item;

      if (!categorySummary[category.main]) {
        categorySummary[category.main] = {
          totalAmount: 0,
          totalCount: 0,
        };
      }

      categorySummary[category.main].totalAmount += price * quantity;
      categorySummary[category.main].totalCount += quantity;
    });

    // Accumulate total price
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    categories: categorySummary,
    orderStatusSummary: {
      Delivered: orders.filter((order) => order.orderStatus === "Delivered").length,
      Processing: totalProcessingOrders,
      totalOrders: totalOrders,
    },
    totalPrice: totalAmount,
  });
});

// apply Voucher..
exports.applyVoucher = tryCatch(async (req, res, next) => {
  // Step 1: Fetch user's past orders
  const orders = await Order.find({ user: req.user._id });

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  const { voucherId } = req.body; // Input from frontend

  // Step 2: Validate voucher existence
  const voucher = await Voucher.findById(voucherId);

  if (!voucher) {
    return next(new ErrorHandler("Voucher not found", 404));
  }

  // Step 3: Check voucher validity
  if (voucher.status !== "Available" || voucher.expiryDate < Date.now()) {
    return next(new ErrorHandler("Voucher is expired or unavailable", 400));
  }

  // Step 4: Calculate discount
  const discountAmount = (totalAmount * voucher.discount) / 100; // Voucher discount percentage
  const finalAmount = totalAmount - discountAmount;

  // Step 5: Update orders with discount
  await Promise.all(
    orders.map(async (order) => {
      order.discountAmount = (order.totalPrice / totalAmount) * discountAmount; // Pro-rate discount per order
      order.voucher = voucher._id; // Save the applied voucher ID
      await order.save(); // Save updated order
    })
  );

  // Step 6: Return response
  res.status(200).json({
    success: true,
    message: "Voucher applied successfully",
    totalAmount,
    discountAmount,
    finalAmount,
  });
});

// get All orders and total income -- Admin..
exports.getAllOrders = tryCatch(async (req, res, next) => {
  const orders = await Order.find().populate({
    path: "user", // Populate from UserProfile
    populate: { path: "user", model: "PhoneUser", select: "phone" },
    select: "personalInformation.fullName personalInformation.address",
  });

  let grossAmount = 0; // Total amount before discounts
  let netAmount = 0;   // Total amount after discounts

  orders.forEach((order) => {
    const orderTotal = order.itemPrice + order.shippingPrice; // Order total before discount
    const discount = order.discountAmount || 0;              // Ensure discountAmount is accounted for

    grossAmount += orderTotal;          // Add to gross total
    netAmount += (orderTotal - discount); // Add discounted total to netAmount
  });

  res.status(200).json({
    success: true,
    grossAmount, // Total amount before discounts
    netAmount,   // Total amount after discounts
    orders,
  });
});