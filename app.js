import express from 'express';
import router from './routes/index.js';
import db from './models/index.js';

const app = express();
db.sequelize.sync();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use('/api/v1', router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
