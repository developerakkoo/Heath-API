const Appointment = require("../models/appointmentsModel");
const Doctor = require("../models/doctorModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");

// Book Appointment..
exports.bookAppointment = tryCatch(async (req, res, next) => {
  const { doctorId, patientId, date, timeSlot, appointmentType } = req.body;

  if (!doctorId || !patientId || !date || !timeSlot || !appointmentType) {
    return next(
      new ErrorHandler("All fields are required to book appointment", 400)
    );
  }
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new ErrorHandler("Doctor Not Found", 400));
  }

  if (!doctor.available) {
    return next(
      new ErrorHandler("Doctor is currently unavailable for appointments", 400)
    );
  }
  const isSlotBooked = doctor.slots_booked.some(
    (slot) =>
      slot.date.toISOString() === new Date(date).toISOString() &&
      slot.timeSlots.includes(timeSlot)
  );
  if (isSlotBooked) {
    return next(
      new ErrorHandler("The selected time slot is already booked", 400)
    );
  }
  const doctorFees =
    appointmentType === "Audio" ? doctor.fees.audio : doctor.fees.video;

  const appointment = await Appointment.create({
    doctor: doctorId,
    patient: patientId,
    date,
    timeSlot,
    appointmentType,
    doctorFees,
  });
  doctor.slots_booked.push({
    date: new Date(date),
    timeSlots: [timeSlot],
  });
  await doctor.save();
  res.status(200).json({
    success: true,
    message: "Appointment booked successfully",
    appointment,
  });
});

// cancle cancelAppointment
exports.cancleAppointment = tryCatch(async (req, res, next) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId).populate(
    "doctor"
  );

  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found", 400));
  }
  if (appointment.status === "Cancelled") {
    return next(new ErrorHandler("Appointment already Cancelled", 400));
  }
  if (appointment.status === "Completed") {
    return next(
      new ErrorHandler("Completed appointments cannot be cancelled", 400)
    );
  }
  appointment.status = "Cancelled";
  await appointment.save();

  // Release the time slot for the doctor
  const doctor = appointment.doctor;
  const { date, timeSlot } = appointment;

  doctor.slots_booked = doctor.slots_booked.map((slot) => {
    if (slot.date.toISOString() === date.toISOString()) {
      slot.timeSlots = slot.timeSlots.filter(
        (slotTime) => slotTime !== timeSlot
      );
    }
    return slot;
  });
  // Save the doctor document
  await doctor.save();
  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    appointment,
  });
});

// fetch all appointments for a patient..
exports.getAppointmentsForPatient = tryCatch(async (req, res, next) => {
  const { patientId } = req.params;
  if (!patientId) {
    return next(new ErrorHandler("Patient ID is required", 400));
  }
  const appointment = await Appointment.find({ patient: patientId })
    .populate("doctor", "name speciality")
    .sort({ date: 1, timeSlot: 1 });
  if (!appointment) {
    return next(
      new ErrorHandler("No appointments found for this patient", 400)
    );
  }
  res.status(200).json({
    success: true,
    appointment,
  });
});

// To fetch all appointments for a doctor..
exports.getAppointmentsForDoctors = tryCatch(async (req, res, next) => {
  const { doctorId } = req.params;
  if (!doctorId) {
    return next(new ErrorHandler("Doctor ID is requires", 400));
  }
  const doctor = await Appointment.find({ doctor: doctorId }).populate(
    "patient"
  );
  if (!doctor || doctor == 0) {
    return next(new ErrorHandler("No appointments found", 400));
  }
  res.status(200).json({
    success: true,
    doctor,
  });
});

// Reschedule Appointment..
exports.rescheduleAppointment = tryCatch(async (req, res, next) => {
  const { appointmentId } = req.params;
  const { newDate, newTimeSlot } = req.body;
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  // Check if the new date and time slot conflict with existing bookings
  const existingConflict = await Appointment.findOne({
    doctor: appointment.doctor,
    date: newDate,
    timeSlot: newTimeSlot,
    status: { $ne: "Cancelled" }, // Exclude cancelled appointments
  });

  if (existingConflict) {
    return res.status(400).json({
      success: false,
      message: "The new date and time slot are already booked.",
    });
  }

  // Update the appointment with the new date and time slot
  appointment.date = newDate;
  appointment.timeSlot = newTimeSlot;
  appointment.updatedAt = Date.now();

  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment rescheduled successfully.",
    appointment,
  });
});

// Update Appointment Status..
exports.updateAppointmentStatus = tryCatch(async (req, res, next) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return next(new ErrorHandler("Appointment not found", 400));
  }
  appointment.status = status;
  appointment.updatedAt = Date.now();
  
  await appointment.save();

  res.status(200).json({
    success: true,
    appointment,
  });
});
