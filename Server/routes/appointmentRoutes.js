const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  bookAppointment,
  cancleAppointment,
  getAppointmentsForPatient,
  getAppointmentsForDoctors,
  rescheduleAppointment,
  updateAppointmentStatus,
  getSuccessfulCompletedAppointments,
  manageDailyAppointments,
} = require("../controllers/appointmentController");
const router = express.Router();

router
  .route("/post/create-appointment")
  .post(IsAuthenticatedUser, bookAppointment);

router
  .route("/delete/cancle-appointment/:appointmentId")
  .delete(IsAuthenticatedUser, cancleAppointment);

router
  .route("/get/appointments-patient/:patientId")
  .get(IsAuthenticatedUser, getAppointmentsForPatient);

router
  .route("/get/appointments-doctor/:doctorId")
  .get(IsAuthenticatedUser, getAppointmentsForDoctors);

router
  .route("/put/reschedule-appointment/:appointmentId")
  .put(IsAuthenticatedUser, rescheduleAppointment);

router
  .route("/put/update-status/:appointmentId")
  .put(IsAuthenticatedUser, updateAppointmentStatus);

router
  .route("/get/total-patients/:docId")
  .get(IsAuthenticatedUser, getSuccessfulCompletedAppointments);

// router
//   .route("/get/daily-appointments/:docId")
//   .get(IsAuthenticatedUser, manageDailyAppointments);

module.exports = router;
