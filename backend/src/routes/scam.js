
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Check advertisement text for common warning signs.
function analyseText(text) {
  const findings = [];

  const rules = [
    {
      pattern: /\b(registration fee|application fee|processing fee|upfront payment|pay upfront|deposit to get (?:the )?job|pay to secure (?:your )?(?:job|position)|pay to apply|pay to get hired|refundable fee)\b/i,
      message: "The advert appears to request an upfront payment or fee to obtain an opportunity."
    },
    {
      pattern: /\b(guaranteed (?:job|employment|income|placement)|job guaranteed|no interview required|skip the interview|hired immediately without (?:an )?interview)\b/i,
      message: "The advert may be promising guaranteed employment or bypassing normal recruitment checks."
    },
    {
      pattern: /\b(get rich quick|easy money|unlimited income|earn money instantly|high pay.{0,30}no experience|earn up to.{0,50}(?:per day|daily|per week|weekly|per month|monthly))\b/i,
      message: "The advert may be making unrealistic income claims or promising unusually high earnings."
    },
    {
      pattern: /\b(act now|limited time only|urgent application|apply immediately|last chance|offer expires today|don't miss out)\b/i,
      message: "The advert uses urgency or pressure that could discourage careful verification."
    },
    {
      pattern: /\b(send (?:us )?(?:your )?(?:password|pin|otp|one.time password)|share (?:your )?(?:password|pin|otp)|provide your (?:password|pin|bank login))\b/i,
      message: "The advert appears to request sensitive login credentials or security codes."
    },
    {
      pattern: /\b(send (?:us )?your (?:bank details|card details|national registration card|nrc number)|upload your (?:nrc|passport|identity document)|provide your bank account details)\b/i,
      message: "The advert requests personal or financial information. Verify the organisation before sharing it."
    },
    {
      pattern: /https?:\/\/(?:www\.)?example\.com(?:[/:?#\s]|$)/i,
      message: "The advert contains an example.com link, commonly used as a placeholder rather than a real application website."
    },
    {
      pattern: /\b(pay|send|transfer|deposit)\b.{0,60}\b(cryptocurrency|crypto|bitcoin|gift card|mobile money|airtime|wallet address)\b|\b(cryptocurrency|crypto|bitcoin|gift card|mobile money|airtime|wallet address)\b.{0,60}\b(pay|send|transfer|deposit)\b/i,
      message: "The advert may be directing payments through cryptocurrency, gift cards, airtime or mobile money. Verify any payment request independently."
    }
  ];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      findings.push(rule.message);
    }
  }

  let risk_level = "LOW";

  if (findings.length >= 3) {
    risk_level = "HIGH";
  } else if (findings.length >= 1) {
    risk_level = "MEDIUM";
  }

  return {
    risk_level,
    findings,
    disclaimer:
      "This automated assessment identifies common warning signs only. It cannot prove that an advert is genuine or fraudulent. Verify the organisation and opportunity independently before paying money or sharing personal information."
  };
}

// POST /api/scam/admin/login
// Administrator login: returns a short-lived JWT.
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      error: "Enter your administrator username and password."
    });
  }

  const configuredUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!configuredUsername || !passwordHash || !jwtSecret) {
    console.error("Administrator login environment settings are missing.");

    return res.status(500).json({
      error: "Administrator login is not configured correctly."
    });
  }

  try {
    const usernameMatches = username.trim() === configuredUsername;
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!usernameMatches || !passwordMatches) {
      return res.status(401).json({
        error: "Invalid administrator username or password."
      });
    }

    const token = jwt.sign(
      {
        role: "ADMIN",
        username: configuredUsername
      },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return res.json({
      message: "Administrator login successful.",
      token,
      expiresIn: 7200
    });
  } catch (error) {
    console.error("Administrator login failed:", error.message);

    return res.status(500).json({
      error: "Could not complete administrator login."
    });
  }
});

// POST /api/scam/check — public scam checker
router.post("/check", async (req, res) => {
  const advertisement =
    typeof req.body?.advertisement_text === "string"
      ? req.body.advertisement_text.trim()
      : "";

  if (advertisement.length < 10 || advertisement.length > 10000) {
    return res.status(400).json({
      error: "Advertisement text must contain between 10 and 10,000 characters."
    });
  }

  const result = analyseText(advertisement);

  // Analysis still works if saving its history fails.
  try {
    await pool.query(
      `INSERT INTO scam_analyses
        (advertisement_text, risk_level, findings, disclaimer)
       VALUES (?, ?, ?, ?)`,
      [
        advertisement,
        result.risk_level,
        JSON.stringify(result.findings),
        result.disclaimer
      ]
    );
  } catch (error) {
    console.error("Could not save scam analysis:", error.message);
  }

  return res.json(result);
});

// POST /api/scam/report — public community report submission
router.post("/report", async (req, res) => {
  const advertisement =
    typeof req.body?.advertisement_text === "string"
      ? req.body.advertisement_text.trim()
      : "";

  const notes =
    typeof req.body?.user_notes === "string"
      ? req.body.user_notes.trim()
      : "";

  const email =
    typeof req.body?.reporter_email === "string"
      ? req.body.reporter_email.trim()
      : "";

  if (advertisement.length < 10 || advertisement.length > 10000) {
    return res.status(400).json({
      error: "Advertisement text must contain between 10 and 10,000 characters."
    });
  }

  if (notes.length > 2000) {
    return res.status(400).json({
      error: "Additional notes must not exceed 2,000 characters."
    });
  }

  if (email.length > 150) {
    return res.status(400).json({
      error: "Email address must not exceed 150 characters."
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: "Please provide a valid email address."
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO scam_reports
        (advertisement_text, reporter_email, user_notes)
       VALUES (?, ?, ?)`,
      [advertisement, email || null, notes || null]
    );

    return res.status(201).json({
      message: "Report submitted successfully.",
      report_id: result.insertId
    });
  } catch (error) {
    console.error("Could not save scam report:", error.message);

    return res.status(500).json({
      error: "Could not save your report. Please try again later."
    });
  }
});

// GET /api/scam/reports — ADMIN ONLY
router.get("/reports", adminAuth, async (req, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT
        id,
        advertisement_text,
        reporter_email,
        user_notes,
        status,
        created_at
      FROM scam_reports
      ORDER BY created_at DESC
    `);

    return res.json({ data: reports });
  } catch (error) {
    console.error("Could not fetch scam reports:", error.message);

    return res.status(500).json({
      error: "Could not retrieve scam reports."
    });
  }
});

// PATCH /api/scam/reports/:id/status — ADMIN ONLY
router.patch("/reports/:id/status", adminAuth, async (req, res) => {
  const reportId = Number(req.params.id);
  const allowedStatuses = ["PENDING", "UNDER REVIEW", "RESOLVED"];
  const { status } = req.body || {};

  if (!Number.isInteger(reportId) || reportId < 1) {
    return res.status(400).json({
      error: "Invalid report ID."
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid report status."
    });
  }

  try {
    const [result] = await pool.query(
      "UPDATE scam_reports SET status = ? WHERE id = ?",
      [status, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Report not found."
      });
    }

    return res.json({
      message: "Report status updated successfully."
    });
  } catch (error) {
    console.error("Could not update scam report:", error.message);

    return res.status(500).json({
      error: "Could not update report status."
    });
  }
});

module.exports = router;
