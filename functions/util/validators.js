const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

exports.validateSignupData = data => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Field must not be empty";
  } else if (!isEmail(data.email)) {
    errors.email = "Field value must be a valid email address";
  }

  if (isEmpty(data.password)) errors.password = "Field must not be empty";
  if (data.confirmPassword !== data.password)
    errors.confirmPassword = "Password fields must match";
  if (isEmpty(data.alias)) errors.alias = "Field must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLoginData = data => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = "Field must not be empty";
  if (isEmpty(data.password)) errors.password = "Field must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.reduceUserDetails = data => {
  let userDetails = {};
  //Make sure an empty string is not submitted to the database
  if (!isEmpty(data.alias.trim())) userDetails.alias = data.alias;
  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }
  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};

exports.validateResetData = data => {
  let errors = {};

  if (isEmpty(data.email)) errors.email = "Field must not be empty";

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.reduceBoozDetails = data => {
  let boozDetails = {};

  //Make sure an empty string is not submitted to the database
  if (!isEmpty(data.drinkName.trim())) boozDetails.drinkName = data.drinkName;
  if (!isEmpty(data.mainAlcohol.trim())) boozDetails.mainAlcohol = data.mainAlcohol;
  if (!isEmpty(data.ingredients.trim())) boozDetails.ingredients = data.ingredients;
  if (!isEmpty(data.preparation.trim())) boozDetails.preparation = data.preparation;
  if (!isEmpty(data.drinkWare.trim())) boozDetails.drinkWare = data.drinkWare;
  
  return boozDetails;
};