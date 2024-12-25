// Middleware to handle async errors
const tryCatchError = (tryCatchFn) => (req, res, next) => {
    Promise.resolve(tryCatchFn(req, res, next)).catch(next);
  };
  
  module.exports = tryCatchError;
  