require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, getPool } = require("./db");
const { requireAuth, requireRole } = require("./middleware/auth");

const app = express();
app.use(helmet());
app.use(cors()); // In production, restrict origin to your frontend URL.
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "RepairIQ API" }));

// Register a normal customer account.
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email and password (minimum 8 characters) are required" });
    }
    const pool = await getPool();
    const existing = await pool.request().input("email", sql.NVarChar, email.toLowerCase()).query(
      "SELECT UserID FROM Users WHERE Email = @email"
    );
    if (existing.recordset.length) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email.toLowerCase())
      .input("hash", sql.NVarChar, hash)
      .query(`INSERT INTO Users (FullName, Email, PasswordHash, Role)
              OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.Role
              VALUES (@name, @email, @hash, 'customer')`);
    res.status(201).json({ user: result.recordset[0] });
  } catch (err) { next(err); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const pool = await getPool();
    const result = await pool.request().input("email", sql.NVarChar, email.toLowerCase())
      .query("SELECT UserID, FullName, Email, PasswordHash, Role FROM Users WHERE Email = @email");
    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }
    const token = jwt.sign(
      { userId: user.UserID, role: user.Role, email: user.Email },
      process.env.JWT_SECRET, { expiresIn: "2h" }
    );
    res.json({ token, user: { id: user.UserID, name: user.FullName, email: user.Email, role: user.Role } });
  } catch (err) { next(err); }
});

// All routes below require a valid login.
app.use("/api", requireAuth);

// DEVICE MANAGEMENT
app.get("/api/devices", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("uid", sql.Int, req.user.userId)
      .query("SELECT * FROM Devices WHERE UserID = @uid ORDER BY CreatedAt DESC");
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.post("/api/devices", async (req, res, next) => {
  try {
    const { deviceType, brand, model, serialNumber } = req.body;
    if (!deviceType || !brand || !model) return res.status(400).json({ message: "deviceType, brand and model are required" });
    const pool = await getPool();
    const result = await pool.request()
      .input("uid", sql.Int, req.user.userId)
      .input("type", sql.NVarChar, deviceType)
      .input("brand", sql.NVarChar, brand)
      .input("model", sql.NVarChar, model)
      .input("serial", sql.NVarChar, serialNumber || null)
      .query(`INSERT INTO Devices (UserID, DeviceType, Brand, Model, SerialNumber)
              OUTPUT INSERTED.* VALUES (@uid, @type, @brand, @model, @serial)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { next(err); }
});

// ISSUE REPORTING
app.get("/api/issues", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("uid", sql.Int, req.user.userId).query(`
      SELECT i.*, d.DeviceType, d.Brand, d.Model
      FROM DeviceIssues i JOIN Devices d ON d.DeviceID = i.DeviceID
      WHERE d.UserID = @uid ORDER BY i.ReportedAt DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.post("/api/issues", async (req, res, next) => {
  try {
    const { deviceId, description, symptoms, severity } = req.body;
    if (!deviceId || !description) return res.status(400).json({ message: "deviceId and description are required" });
    const pool = await getPool();
    const owned = await pool.request().input("did", sql.Int, deviceId).input("uid", sql.Int, req.user.userId)
      .query("SELECT DeviceID FROM Devices WHERE DeviceID = @did AND UserID = @uid");
    if (!owned.recordset.length) return res.status(404).json({ message: "Device not found" });
    const result = await pool.request()
      .input("did", sql.Int, deviceId).input("desc", sql.NVarChar(sql.MAX), description)
      .input("sym", sql.NVarChar(sql.MAX), symptoms || null)
      .input("severity", sql.NVarChar, severity || "medium")
      .query(`INSERT INTO DeviceIssues (DeviceID, Description, Symptoms, Severity)
              OUTPUT INSERTED.* VALUES (@did, @desc, @sym, @severity)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { next(err); }
});

// SERVICE PROVIDERS & REPAIR ESTIMATES
app.get("/api/providers", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM ServiceProviders WHERE IsActive = 1 ORDER BY ProviderName");
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.get("/api/issues/:issueId/estimates", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("iid", sql.Int, req.params.issueId)
      .input("uid", sql.Int, req.user.userId).query(`
        SELECT e.*, p.ProviderName, p.ContactEmail
        FROM RepairEstimates e
        JOIN ServiceProviders p ON p.ProviderID = e.ProviderID
        JOIN DeviceIssues i ON i.IssueID = e.IssueID
        JOIN Devices d ON d.DeviceID = i.DeviceID
        WHERE e.IssueID = @iid AND d.UserID = @uid
        ORDER BY e.EstimatedCost ASC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

// Only staff/admin accounts should be granted these roles by a trusted admin process.
app.post("/api/estimates", requireRole("staff", "admin"), async (req, res, next) => {
  try {
    const { issueId, providerId, estimatedCost, notes } = req.body;
    if (!issueId || !providerId || estimatedCost == null || Number(estimatedCost) < 0) {
      return res.status(400).json({ message: "issueId, providerId and a non-negative estimatedCost are required" });
    }
    const pool = await getPool();
    const result = await pool.request().input("iid", sql.Int, issueId).input("pid", sql.Int, providerId)
      .input("cost", sql.Decimal(10, 2), estimatedCost).input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query(`INSERT INTO RepairEstimates (IssueID, ProviderID, EstimatedCost, Notes)
              OUTPUT INSERTED.* VALUES (@iid, @pid, @cost, @notes)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { next(err); }
});

// REPAIR HISTORY
app.get("/api/repairs", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("uid", sql.Int, req.user.userId).query(`
      SELECT rh.*, d.DeviceType, d.Brand, d.Model, i.Description AS IssueDescription,
             p.ProviderName
      FROM RepairHistory rh
      JOIN Devices d ON d.DeviceID = rh.DeviceID
      LEFT JOIN DeviceIssues i ON i.IssueID = rh.IssueID
      LEFT JOIN ServiceProviders p ON p.ProviderID = rh.ProviderID
      WHERE d.UserID = @uid ORDER BY rh.RepairDate DESC`);
    res.json(result.recordset);
  } catch (err) { next(err); }
});

app.post("/api/repairs", async (req, res, next) => {
  try {
    const { deviceId, issueId, providerId, repairDate, amountPaid, workDescription } = req.body;
    if (!deviceId || !repairDate || amountPaid == null || Number(amountPaid) < 0) {
      return res.status(400).json({ message: "deviceId, repairDate and non-negative amountPaid are required" });
    }
    const pool = await getPool();
    const owned = await pool.request().input("did", sql.Int, deviceId).input("uid", sql.Int, req.user.userId)
      .query("SELECT DeviceID FROM Devices WHERE DeviceID = @did AND UserID = @uid");
    if (!owned.recordset.length) return res.status(404).json({ message: "Device not found" });
    const result = await pool.request().input("did", sql.Int, deviceId).input("iid", sql.Int, issueId || null)
      .input("pid", sql.Int, providerId || null).input("date", sql.Date, repairDate)
      .input("amount", sql.Decimal(10, 2), amountPaid).input("work", sql.NVarChar(sql.MAX), workDescription || null)
      .query(`INSERT INTO RepairHistory (DeviceID, IssueID, ProviderID, RepairDate, AmountPaid, WorkDescription)
              OUTPUT INSERTED.* VALUES (@did, @iid, @pid, @date, @amount, @work)`);
    res.status(201).json(result.recordset[0]);
  } catch (err) { next(err); }
});

// Central error handler: never expose SQL details to clients.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`RepairIQ API running on port ${port}`));
