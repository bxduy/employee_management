import validator from 'validator';

export const validation = (action, infor) => {
  switch (action) {
    case 'register':
      return validateRegister(infor)
    case 'login':
      return validateLogin(infor)
    case 'editProfile':
      return validateEditProfile(infor)
    case 'changePassword':
      return validateChangePassword(infor)
    default:
      return 'Invalid action'
  }
};

const validateRegister = (infor) => {
  const errors = []

  validateRequiredString('Firstname', infor.firstname, errors)
  validateRequiredString('Lastname', infor.lastname, errors)
  validateEmail(infor.email, errors)
  validatePassword(infor.password, errors)

  return errors.length ? errors.join(', ') : null
}

const validateLogin = (infor) => {
  const errors = []

  validateRequiredString('Employee code', infor.employee_code, errors)
  validatePassword(infor.password, errors)

  return errors.length ? errors.join(', ') : null
}

const validateEditProfile = (infor) => {
  const errors = []

  validateRequiredString('Firstname', infor.firstname, errors)
  validateRequiredString('Lastname', infor.lastname, errors)
  validateEmail(infor.email, errors)

  return errors.length ? errors.join(', ') : null
}

const validateChangePassword = (infor) => {
  const errors = []

  validatePassword(infor.newPassword, errors)
  validateRequiredString('Confirm password', infor.confirmPassword, errors)

  if (infor.newPassword !== infor.confirmPassword) {
    errors.push('New password and confirm password do not match')
  }

  return errors.length ? errors.join(', ') : null
}

const validateRequiredString = (fieldName, value, errors) => {
  if (!value || typeof value !== 'string' || validator.isEmpty(value.trim())) {
    errors.push(`${fieldName} must not be empty`)
  }
}

const validateEmail = (email, errors) => {
  if (!validator.isEmail(email.trim())) {
    errors.push('Email must be a valid email address')
  }
}

const validatePassword = (password, errors) => {
  if (!password || typeof password !== 'string') {
    errors.push('Password must be a string')
  }
  if (!validator.isLength(password, { min: 8 })) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!validator.matches(password, /[A-Z]/)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!validator.matches(password, /[a-z]/)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!validator.matches(password, /[0-9]/)) {
    errors.push('Password must contain at least one digit')
  }
  if (!validator.matches(password, /[!@#$%^&*(),.?":{}|<>]/)) {
    errors.push('Password must contain at least one special character')
  }
}

