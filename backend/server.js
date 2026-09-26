const express = require('express');
const leadRoutes = require("./routes/leadRoutes");

const app = express();

const PORT = 5000;

// Middleware to parse JSON requests
app.use(express.json());

app.use("/api/leads", leadRoutes);

// ========================================
// START THE SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})