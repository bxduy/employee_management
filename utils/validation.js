import validator from 'validator';

export const validation = (action, infor) => {
  switch (action) {
    case 'register':
      return validateRegister(infor);
    case 'login':
      return validateLogin(infor);
    case 'editProfile':
      return validateEditProfile(infor);
    case 'changePassword':
      return validateChangePassword(infor);
    default:
      return 'Invalid action';
  }
};

const validateRegister = (infor) => {
  if (!infor.firstname || typeof infor.firstname !== 'string' || validator.isEmpty(infor.firstname.trim())) {
    return 'Firstname must not be empty';
  }
  if (!infor.lastname || typeof infor.lastname !== 'string' || validator.isEmpty(infor.lastname.trim())) {
    return 'Lastname must not be empty';
  }
  if (!validator.isEmail(infor.email.trim())) {
    return 'Email must be a valid email address';
  }
  return validatePassword(infor.password);
};

const validateLogin = (infor) => {
  if (!infor.employee_code || typeof infor.employee_code !== 'string' || validator.isEmpty(infor.employee_code.trim())) {
    return 'Employee code must not be empty';
  }
  return validatePassword(infor.password);
};

const validateEditProfile = (infor) => {
  if (!infor.firstname || typeof infor.firstname !== 'string' || validator.isEmpty(infor.firstname.trim())) {
    return 'Firstname must not be empty';
  }
  if (!infor.lastname || typeof infor.lastname !== 'string' || validator.isEmpty(infor.lastname.trim())) {
    return 'Lastname must not be empty';
  }
  if (!validator.isEmail(infor.email.trim())) {
    return 'Email must be a valid email address';
  }
  return null;
};

const validateChangePassword = (infor) => {
  const passwordError = validatePassword(infor.newPassword);
  if (passwordError) {
    return passwordError;
  }
  if (!infor.confirmPassword || typeof infor.confirmPassword !== 'string' || validator.isEmpty(infor.confirmPassword.trim())) {
    return 'Confirm password must not be empty';
  }
  if (infor.newPassword !== infor.confirmPassword) {
    return 'New password and confirm password do not match';
  }
  return null;
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password must be a string';
  }
  if (!validator.isLength(password, { min: 8 })) {
    return 'Password must be at least 8 characters long';
  }
  if (!validator.matches(password, /[A-Z]/)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!validator.matches(password, /[a-z]/)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!validator.matches(password, /[0-9]/)) {
    return 'Password must contain at least one digit';
  }
  if (!validator.matches(password, /[!@#$%^&*(),.?":{}|<>]/)) {
    return 'Password must contain at least one special character';
  }
  return null;
};
