const errorFormatter = (error, req, res, next) => {
  const serverError = "Something went wrong";
  const validationError = "Validation Error(s)";
  console.log("hello there");
  let errorMsg = serverError;
  let status = 500;
  customErrors = [];
  if (error.code === 11000) {
    status = 400;
    errorMsg = validationError;
    customErrors = uniqueIndexError(error);
  } else if (error.name === "ValidationError") {
    errorMsg = validationError;
    const { errors } = error;
    const errorList = [];
    Object.keys(errors).forEach((error) => {
      errorList.push({
        field: error,
        validationError: errors[error].message,
      });
    });
    customErrors = errorList;
  }
  return createResponse(res, errorMsg, status, customErrors);
};

const uniqueIndexError = (error) => {
  let errorMsg = "";
  if (error.keyPattern) {
    const { email } = error.keyPattern;
    const { email: emailVal } = error.keyValue;
    if (email) {
      errorMsg = `${emailVal} email already in use`;
    }
  }
  return [
    {
      field: "email",
      validationError: errorMsg,
    },
  ];
};
const createResponse = (res, responseMessage, status, validationError) => {
  return res.status(status || 500).json({
    error: true,
    response: responseMessage,
    data: null,
    validationError,
  });
};

module.exports = { errorFormatter };
