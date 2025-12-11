// backend/server.js
require('dotenv').config();


const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');



const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const testsRoutes = require('./Routes/testRoutes');
const scoreRoutes = require('./Routes/scoreRoutes');
const classRoutes = require('./Routes/classROutes');
const otpRoutes = require("./Routes/otpRoutes");

const app = express();


app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use(express.json());
app.use(cookieParser());
// Parse JSON bodies
app.use(bodyParser.json());


app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tests', testsRoutes);
app.use('/score', scoreRoutes);
app.use('/c', classRoutes);
app.use("/otp", otpRoutes);



const PORT = process.env.PORT || 5000;
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));












