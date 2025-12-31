
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

// app.use(cors({
//   origin: true,        // Reflects the requester's origin
//   credentials: true,
// }));

// app.use(cors({ origin: ' http://192.168.0.104:5173', credentials: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.0.104:5173",
  "http://192.168.0.204:5173",
  "http://192.168.0.*:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow mobile apps / postman

    // Allow localhost + any LAN IP starting with 192.168.0.
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith("http://192.168.0.")
    ) {
      return callback(null, true);
    }

    return callback(new Error("CORS Blocked: " + origin));
  },
  credentials: true,
}));


app.use(express.json());
app.use(cookieParser());
// Parse JSON bodies
app.use(bodyParser.json());


app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tests', testsRoutes);
app.use('/score', scoreRoutes);
app.use('/classes', classRoutes);
app.use("/otp", otpRoutes);



const PORT = process.env.PORT || 5000;

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));























