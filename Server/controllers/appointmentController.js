const Appointment = require("../models/appointmentsModel");
const Doctor = require("../models/doctorModel");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");

// Book Appointment..
exports.bookAppointment = tryCatch(async (req, res, next) => {
  const { doctorId, patientId, date, timeSlot, appointmentType } = req.body;

  if (!doctorId || !patientId || !date || !timeSlot || !appointmentType) {
    return next(
      new ErrorHandler("All fields are required to book an appointment", 400)
    );
  }

  // Find the doctor by ID
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found", 400));
  }

  if (!doctor.available) {
    return next(
      new ErrorHandler("Doctor is currently unavailable for appointments", 400)
    );
  }

  // Find the available slot for the given date and time slot
  const availableSlot = doctor.availableSlots.find(
    (slot) =>
      slot.date.toISOString().split("T")[0] === new Date(date).toISOString().split("T")[0] &&
      slot.timeSlots.includes(timeSlot)
  );

  if (!availableSlot) {
    return next(
      new ErrorHandler("The selected time slot is not available", 400)
    );
  }

  // Remove the slot from availableSlots
  availableSlot.timeSlots = availableSlot.timeSlots.filter(
    (slot) => slot !== timeSlot
  );

  // If no time slots left for that date, remove the date from availableSlots
  if (availableSlot.timeSlots.length === 0) {
    doctor.availableSlots = doctor.availableSlots.filter(
      (slot) => slot.date.toISOString() !== availableSlot.date.toISOString()
    );
  }

  // Add the slot to slots_booked
  doctor.slots_booked.push({
    date: new Date(date),
    timeSlots: [timeSlot],
  });

  // Calculate doctor fees based on appointment type
  const doctorFees =
    appointmentType === "Audio" ? doctor.fees.audio : doctor.fees.video;

  // Create the appointment record
  const appointment = await Appointment.create({
    doctor: doctorId,
    patient: patientId,
    date,
    timeSlot,
    appointmentType,
    doctorFees,
  });

  // Save the updated doctor information
  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Appointment booked successfully",
    appointment,
  });
});

// cancle cancelAppointment
exports.cancelAppointment = tryCatch(async (req, res, next) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId).populate("doctor");

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

  // Update appointment status to Cancelled
  appointment.status = "Cancelled";
  await appointment.save();

  // Get the doctor and the appointment details
  const doctor = appointment.doctor;
  const { date, timeSlot } = appointment;

  // Remove the cancelled slot from the slots_booked array
  doctor.slots_booked = doctor.slots_booked.map((slot) => {
    if (slot.date.toISOString() === date.toISOString()) {
      slot.timeSlots = slot.timeSlots.filter(
        (slotTime) => slotTime !== timeSlot
      );
    }
    return slot;
  });

  // Add the cancelled time slot back to availableSlots
  const availableSlot = doctor.availableSlots.find(
    (slot) => slot.date.toISOString() === date.toISOString()
  );

  if (availableSlot) {
    // If the slot for the date exists, add the cancelled time slot back
    availableSlot.timeSlots.push(timeSlot);
  } else {
    // If no available slot exists for the date, create a new one
    doctor.availableSlots.push({
      date: new Date(date),
      timeSlots: [timeSlot],
    });
  }

  // Save the updated doctor document
  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully and time slot made available",
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

// Count the successfully completed Appointments Count and update in Doctor patient schems..
exports.getSuccessfulCompletedAppointments = tryCatch(
  async (req, res, next) => {
    const { docId } = req.params;
    const countPatient = await Appointment.countDocuments({
      doctor: docId,
      status: "Completed",
    });
    await Doctor.findByIdAndUpdate(
      docId,
      { patients: countPatient },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      totalPatients: countPatient,
    });
  }
);

// Doctor get his daily Appointments..
/*
exports.manageDailyAppointments = tryCatch( async (req, res, next) => {
    const { docId } = req.params;

    // Find the doctor document
    const doctor = await Doctor.findById(docId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check if 24 hours have passed since the last reset
    const timeDifference = moment().diff(moment(doctor.lastUpdated), 'hours');

    if (timeDifference >= 24) {
      // Reset daily count and patientsAttended after 24 hours
      doctor.dailyAppointmentsCount = 0;
      doctor.patientsAttended = 0; // Reset patients attended at the start of the new day
      doctor.lastUpdated = Date.now(); // Update the lastUpdated timestamp
    }

    // Count the number of completed appointments for today (excluding cancelled ones)
    const dailyAppointments = await Appointment.countDocuments({
      doctor: docId,
      date: { $gte: moment().startOf("day").toDate() },
      status: ["Completed","Pending"]// Only count completed appointments
    });

    // Update the dailyAppointmentsCount and patientsAttended
    doctor.dailyAppointmentsCount = dailyAppointments;
    doctor.patientsAttended = dailyAppointments; // Directly set this to the daily completed count

    // Save the updated doctor document (only if there were changes)
    await doctor.save();

    // Handle appointment cancellation if any
    if (req.body.appointmentId && req.body.status === "Cancelled") {
      const appointment = await Appointment.findById(req.body.appointmentId).populate('doctor');

      if (!appointment || appointment.status === "Cancelled") {
        return res.status(404).json({
          success: false,
          message: "Appointment not found or already cancelled",
        });
      }

      // Update appointment status to cancelled
      appointment.status = "Cancelled";
      await appointment.save();

      // Decrease the daily count of appointments for the doctor
      doctor.dailyAppointmentsCount = Math.max(0, doctor.dailyAppointmentsCount - 1);

      // Recalculate the patientsAttended (only decrease if it's greater than 0)
      doctor.patientsAttended = Math.max(0, doctor.patientsAttended - 1);

      // Save the updated doctor document after cancellation
      await doctor.save();
    }

    // Return the daily count and total patients attended
    res.status(200).json({
      success: true,
      dailyAppointmentsCount: doctor.dailyAppointmentsCount,
      patientsAttended: doctor.patientsAttended,
    });
  }
);

*/

// To check if a doctor is available for a specific date or time slot..
exports.checkDoctorAvailability = tryCatch(async (req, res, next) => {
  const { doctorId } = req.params; // Get doctorId from URL params
  // const { date, timeSlots } = req.query;
  const { date, timeSlots } = req.body;


  // Validate required inputs
  if (!doctorId || !date || !timeSlots) {
    return next(
      new ErrorHandler("Doctor ID, date, and time slots are required.", 400)
    );
  }

  const formattedDate = new Date(date);

  // Find the doctor by ID
  const doctor = await Doctor.findById(doctorId).select("availableSlots");
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found.", 404));
  }

  // Check if the doctor has any available slots
  if (!doctor.availableSlots || !Array.isArray(doctor.availableSlots)) {
    return res.status(200).json({
      success: true,
      available: false,
      message: "No slots available for this doctor.",
    });
  }

  // Find the slot for the requested date
  const slotForDate = doctor.availableSlots.find(
    (s) => s.date.toISOString().split("T")[0] === formattedDate.toISOString().split("T")[0]
  );

  if (!slotForDate) {
    return res.status(200).json({
      success: true,
      available: false,
      message: "Doctor is not available on this date.",
    });
  }

  // Check if the requested time slot is available
  const isAvailable = slotForDate.timeSlots.includes(timeSlots);

  return res.status(200).json({
    success: true,
    available: isAvailable,
    message: isAvailable
      ? "Doctor is available for the specified time slot."
      : "Doctor is not available for the specified time slot.",
  });
});


// check doctors available for a specific date or time slot..
exports.checkDoctorsAvailability = tryCatch(async (req, res, next) => {
  // const { date, timeSlots } = req.query;
  const { date, timeSlots } = req.body;


  // Validate required inputs
  if (!date || !timeSlots) {
    return next(
      new ErrorHandler("Date and time slots are required.", 400)
    );
  }

  const formattedDate = new Date(date);

  // Parse the timeSlots (handling ranges)
  const timeSlotRequested = timeSlots.trim();

  // Find all doctors who have slots available for the specified date
  const doctors = await Doctor.find({ "availableSlots.date": { $eq: formattedDate } });

  if (doctors.length === 0) {
    return res.status(200).json({
      success: true,
      available: false,
      message: "No doctors available on this date.",
    });
  }

  // Initialize an array to store available doctors
  const availableDoctors = [];

  // Loop through doctors to check if they are available at the requested time slots
  for (const doctor of doctors) {
    // Find the slot for the requested date
    const slotForDate = doctor.availableSlots.find(
      (s) => s.date.toISOString().split("T")[0] === formattedDate.toISOString().split("T")[0]
    );

    // If slot for date exists, check if the requested time slot is available
    if (slotForDate && slotForDate.timeSlots.includes(timeSlotRequested)) {
      availableDoctors.push({
        doctorId: doctor._id,
        name: doctor.name,
        speciality: doctor.speciality,
        available: true,
      });
    }
  }

  // If no doctors are available
  if (availableDoctors.length === 0) {
    return res.status(200).json({
      success: true,
      available: false,
      message: "No doctors available for the specified time slot.",
    });
  }

  // Return the available doctors
  return res.status(200).json({
    success: true,
    available: true,
    availableDoctors: availableDoctors,
  });
});


