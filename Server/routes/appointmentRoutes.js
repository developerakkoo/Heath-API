const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const {
  bookAppointment,
  cancelAppointment ,
  getAppointmentsForPatient,
  getAppointmentsForDoctors,
  rescheduleAppointment,
  updateAppointmentStatus,
  getSuccessfulCompletedAppointments,
  manageDailyAppointments,
  checkDoctorAvailability,
  checkDoctorsAvailability,
} = require("../controllers/appointmentController");
const router = express.Router();

router
  .route("/post/create-appointment")
  .post(IsAuthenticatedUser, bookAppointment);

router
  .route("/delete/cancle-appointment/:appointmentId")
  .delete(IsAuthenticatedUser, cancelAppointment );

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

router.route("/get/check-availability/:doctorId").get(IsAuthenticatedUser,checkDoctorAvailability)

router.route("/get/check-availability").get(IsAuthenticatedUser,checkDoctorsAvailability)

module.exports = router;
