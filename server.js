
require('dotenv').config(); // Trigger restart


const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');



const unityRoutes = require('./Routes/unityRoutes');
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const testsRoutes = require('./Routes/testRoutes');
const scoreRoutes = require('./Routes/scoreRoutes');
const classRoutes = require('./Routes/classROutes');
const otpRoutes = require("./Routes/otpRoutes");
const testSetRoutes = require("./Routes/testSetRoutes");
const progressRoutes = require("./Routes/progressRoutes");
const subtopicRoutes = require('./Routes/subtopicRoutes');
const completionprogressRoutes = require('./Routes/completionprogressRoutes');
const droneTrainingRoutes = require('./Routes/droneTrainingRoutes');

const app = express();



// app.use(cors({
//   origin: true,        // Reflects the requester's origin
//   credentials: true,
// }));

// app.use(cors({ origin: ' http://192.168.0.104:5173', credentials: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://192.168.0.104:5173",
  "http://192.168.0.104:5174"
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


app.use(express.json({ limit: '30mb' }));
app.use(cookieParser());
// Parse JSON bodies
app.use(bodyParser.json({ limit: '30mb' }));

// Serve static files from the uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const retestRoutes = require("./Routes/retestRoutes");

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tests', testsRoutes);
app.use('/score', scoreRoutes);
app.use('/classes', classRoutes);
app.use("/otp", otpRoutes);
app.use('/unity', unityRoutes);
app.use("/test-sets", testSetRoutes);
app.use("/subtest", testSetRoutes); // Added alias for frontend compatibility
app.use("/progress", progressRoutes); // Student progress tracking
app.use("/retest", retestRoutes);
app.use('/subtopics', subtopicRoutes);
app.use('/completion-progress', completionprogressRoutes);
app.use('/drone-training', droneTrainingRoutes); // Drone training module system





const PORT = process.env.PORT || 5000;

app.listen(5000, '0.0.0.0', async () => {
  console.log('Server running on port 5000');
  // console.log('SERVER ABSOLUTE PATH:', __dirname);
  // console.log('-------------------------------------------');

  // Initialize Unity build file protection
  try {
    const buildProtector = require('./Services/unityBuildProtector');
    // console.log('🔒 Initializing Unity build file protection...');
    await buildProtector.loadAndProtectAllBuilds();
    // console.log('✅ Unity build file protection active');
  } catch (error) {
    console.error('⚠️  Failed to initialize build protection:', error.message);
    // console.error('   Builds will not be protected from direct deletion');
  }
});

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));























