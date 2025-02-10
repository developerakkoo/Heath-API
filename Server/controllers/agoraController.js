const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const mongoose = require("mongoose");


const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

exports.agoraTokenGenerate = tryCatch(async (req, res, next) => {
    const { channelName, uid, role, tokenType, expiryTime } = req.body;
  
    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ error: "Agora credentials are missing" });
    }
    if (!channelName) {
      return res.status(400).json({ error: "Channel name is required" });
    }
  
    const roles = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expireTime = expiryTime || 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
  
    let token;
    if (tokenType === "rtc") { // ✅ Fixed the condition
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid || 0,
        roles,
        privilegeExpireTime
      );
    } else {
      return next(new ErrorHandler("Invalid token type", 400));
    }
  
    res.status(200).json({
      success: true,
      token,
      uid,
      channelName,
      role,
    });
  });

// exports.agoraTokenGenerate = tryCatch(async (req, res, next) => {
//     const { channelName, role, tokenType, expiryTime } = req.body;
  
//     if (!APP_ID || !APP_CERTIFICATE) {
//       return res.status(500).json({ error: "Agora credentials are missing" });
//     }
//     if (!channelName) {
//       return res.status(400).json({ error: "Channel name is required" });
//     }
  
//     // Ensure authenticated user is available
//     if (!req.user || !req.user.id) {
//       return next(new ErrorHandler("Unauthorized user", 401));
//     }
  
//     // Convert MongoDB ObjectId to a numeric UID for Agora
//     let agoraUid;
//     if (mongoose.Types.ObjectId.isValid(req.user.id)) {
//       agoraUid = parseInt(req.user.id.substring(0, 8), 16); // Convert first 8 hex characters to decimal
//     } else {
//       return next(new ErrorHandler("Invalid user ID format", 400));
//     }
  
//     const roles = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
//     const expireTime = expiryTime || 3600;
//     const privilegeExpireTime = Math.floor(Date.now() / 1000) + expireTime;
  
//     let token;
//     if (tokenType === "rtc") {
//       token = RtcTokenBuilder.buildTokenWithUid(
//         APP_ID,
//         APP_CERTIFICATE,
//         channelName,
//         agoraUid, // ✅ Use converted phoneUser ID as UID
//         roles,
//         privilegeExpireTime
//       );
//     } else {
//       return next(new ErrorHandler("Invalid token type", 400));
//     }
  
//     res.status(200).json({
//       success: true,
//       token,
//       uid: agoraUid, // Return the numeric UID
//       channelName,
//       role,
//     });
//   });