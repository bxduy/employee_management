import { validation } from '../utils/validation.js';

export const validateRegiser = (req, res, next) => {
    const { firstname, lastname, password, email } = req.body;
    const validateObj = { firstname, lastname, password, email };
    const action = 'register';
    const validateErr = validation(action, validateObj);

    if (validateErr) {
        return res.status(400).send({ message: validateErr });
    }

    next();
};
