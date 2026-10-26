
import React, { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:5000/api";

function App() {
  const [tab, setTab] = useState("opportunities");
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  // Scam checker state
  const [adText, setAdText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkerError, setCheckerError] = useState("");

  // Community scam reporting state
  const [reportNotes, setReportNotes] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reporting, setReporting] = useState(false);

  // Admin scam reports state
  const [scamReports, setScamReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [reportsMessage, setReportsMessage] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("ALL");

  // Opportunity verification state
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [verificationFilter, setVerificationFilter] =
    useState("UNVERIFIED");
  const [updatingOpportunityId, setUpdatingOpportunityId] =
    useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  // Administrator authentication
  const [adminToken, setAdminToken] = useState(() => {
    try {
      return sessionStorage.getItem("ZFind_admin_token") || "";
    } catch {
      return "";
    }
  });

  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  // Saved opportunities
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ZFind_saved") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ZFind_saved", JSON.stringify(saved));
    } catch (error) {
      console.error("Could not save opportunities:", error);
    }
  }, [saved]);

  // Load opportunities
  async function loadOpportunities() {
    try {
      const response = await fetch(`${API}/opportunities`);

      if (!response.ok) {
        throw new Error("Could not load listings.");
      }

      const result = await response.json();
      setOpportunities(result.data || []);
      setApiError("");
    } catch {
      setApiError(
        "Can't reach the backend yet. Start the API and check its database connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  // Load private scam reports after administrator login
  useEffect(() => {
    if (tab !== "reports" || !adminToken) {
      setReportsLoading(false);
      setScamReports([]);
      return;
    }

    let cancelled = false;

    async function loadScamReports() {
      setReportsLoading(true);
      setReportsError("");
      setReportsMessage("");

      try {
        const response = await fetch(`${API}/scam/reports`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        const result = await response.json();

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("ZFind_admin_token");
          setAdminToken("");
          setScamReports([]);

          throw new Error(
            "Your administrator session expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              "Could not load scam reports."
          );
        }

        if (!cancelled) {
          setScamReports(result.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setReportsError(error.message || "Could not contact the API.");
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    }

    loadScamReports();

    return () => {
      cancelled = true;
    };
  }, [tab, adminToken]);

  // Administrator login
  async function loginAdministrator(event) {
    event.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError("");

    try {
      const response = await fetch(`${API}/scam/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Administrator login failed."
        );
      }

      if (!result.token) {
        throw new Error("The server did not return a login token.");
      }

      sessionStorage.setItem("ZFind_admin_token", result.token);
      setAdminToken(result.token);
      setAdminPassword("");
      setAdminLoginError("");
      setReportsError("");
      setVerificationError("");
    } catch (error) {
      setAdminLoginError(error.message || "Could not contact the API.");
    } finally {
      setAdminLoginLoading(false);
    }
  }

  // Administrator logout
  function logoutAdministrator() {
    sessionStorage.removeItem("ZFind_admin_token");
    setAdminToken("");
    setAdminPassword("");
    setScamReports([]);
    setReportsError("");
    setReportsMessage("");
    setAdminLoginError("");
    setReportSearch("");
    setReportFilter("ALL");
    setVerificationMessage("");
    setVerificationError("");
  }

  // Update a scam report's review status
  async function updateScamReportStatus(reportId, status) {
    setUpdatingReportId(reportId);
    setReportsError("");
    setReportsMessage("");

    try {
      const response = await fetch(
        `${API}/scam/reports/${reportId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem("ZFind_admin_token");
        setAdminToken("");
        setScamReports([]);

        throw new Error(
          "Your administrator session expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Could not update report status."
        );
      }

      setScamReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status } : report
        )
      );

      setReportsMessage(`Report #${reportId} updated to ${status}.`);
    } catch (error) {
      setReportsError(error.message || "Could not contact the API.");
    } finally {
      setUpdatingReportId(null);
    }
  }

  // Search and filter opportunities on the public page
  const visible = useMemo(
    () =>
      opportunities.filter((item) => {
        const matchesCategory =
          category === "ALL" || item.category === category;

        const query = search.trim().toLowerCase();

        const matchesSearch =
          !query ||
          `${item.title} ${item.organisation} ${
            item.description || ""
          }`
            .toLowerCase()
            .includes(query);

        return matchesCategory && matchesSearch;
      }),
    [opportunities, category, search]
  );

  // Search and filter scam reports
  const filteredScamReports = useMemo(() => {
    return scamReports.filter((report) => {
      const matchesStatus =
        reportFilter === "ALL" ||
        (report.status || "PENDING") === reportFilter;

      const query = reportSearch.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(report.id || "").toLowerCase().includes(query) ||
        String(report.advertisement_text || "")
          .toLowerCase()
          .includes(query) ||
        String(report.reporter_email || "")
          .toLowerCase()
          .includes(query) ||
        String(report.user_notes || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [scamReports, reportSearch, reportFilter]);

  // Scam report statistics
  const pendingReports = scamReports.filter(
    (report) => (report.status || "PENDING") === "PENDING"
  ).length;

  const reviewingReports = scamReports.filter(
    (report) => report.status === "UNDER REVIEW"
  ).length;

  const resolvedReports = scamReports.filter(
    (report) => report.status === "RESOLVED"
  ).length;

  // Search and filter opportunities in the verification dashboard
  const filteredVerificationOpportunities = useMemo(() => {
    const query = opportunitySearch.trim().toLowerCase();

    return opportunities.filter((item) => {
      const status = item.verification_status || "UNVERIFIED";

      const matchesStatus =
        verificationFilter === "ALL" ||
        status === verificationFilter;

      const matchesSearch =
        !query ||
        `${item.title} ${item.organisation} ${
          item.description || ""
        }`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [opportunities, opportunitySearch, verificationFilter]);

  // Opportunity verification statistics
  const unverifiedOpportunities = opportunities.filter(
    (item) => (item.verification_status || "UNVERIFIED") === "UNVERIFIED"
  ).length;

  const verifiedOpportunities = opportunities.filter(
    (item) => item.verification_status === "VERIFIED"
  ).length;

  const rejectedOpportunities = opportunities.filter(
    (item) => item.verification_status === "REJECTED"
  ).length;

  // Update an opportunity's verification status
  async function updateOpportunityVerification(id, status) {
    if (!adminToken) {
      setVerificationError("Please log in as an administrator first.");
      return;
    }

    setUpdatingOpportunityId(id);
    setVerificationError("");
    setVerificationMessage("");

    try {
      const response = await fetch(
        `${API}/opportunities/${id}/verification`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem("ZFind_admin_token");
        setAdminToken("");
        setVerificationError(
          "Your administrator session expired. Please log in again."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Could not update verification status."
        );
      }

      setOpportunities((current) =>
        current.map((item) =>
          Number(item.id) === Number(id)
            ? { ...item, verification_status: status }
            : item
        )
      );

      setVerificationMessage(
        `Opportunity #${id} updated to ${status}.`
      );
    } catch (error) {
      setVerificationError(
        error.message || "Could not contact the backend."
      );
    } finally {
      setUpdatingOpportunityId(null);
    }
  }

  // Save or unsave an opportunity
  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  // Check an advertisement for common scam warning signs
  async function checkAdvertisement(event) {
    event.preventDefault();
    setChecking(true);
    setAnalysis(null);
    setCheckerError("");

    try {
      const response = await fetch(`${API}/scam/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertisement_text: adText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "The check failed.");
      }

      setAnalysis(result);
    } catch (error) {
      setCheckerError(error.message || "Could not contact the API.");
    } finally {
      setChecking(false);
    }
  }

  // Submit a community scam report
  async function submitScamReport(event) {
    event.preventDefault();
    setReporting(true);
    setReportStatus("");

    try {
      const response = await fetch(`${API}/scam/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          advertisement_text: adText,
          user_notes: reportNotes,
          reporter_email: reportEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not submit your report."
        );
      }

      setReportStatus(
        `Report submitted successfully. Reference number: ${result.report_id}`
      );

      setReportNotes("");
      setReportEmail("");
    } catch (error) {
      setReportStatus(
        `Report failed: ${error.message || "Could not contact the server."}`
      );
    } finally {
      setReporting(false);
    }
  }

  // Saved opportunities
  const savedItems = opportunities.filter((item) =>
    saved.includes(item.id)
  );

  // Show the correct public verification label
  function verificationLabel(status) {
    if (status === "VERIFIED") return "✓ Verified source";
    if (status === "REJECTED") return "✕ Rejected listing";
    return "○ Not verified";
  }

  return (
    <div className="app-shell">
      {/* Header and navigation */}
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setTab("opportunities");
          }}
          aria-label="ZFind home"
        >
          <span className="brand-mark">Z</span>
          <span>ZFind</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <button
            className={tab === "opportunities" ? "nav active" : "nav"}
            onClick={() => setTab("opportunities")}
          >
            Opportunities
          </button>

          <button
            className={tab === "checker" ? "nav active" : "nav"}
            onClick={() => setTab("checker")}
          >
            Scam checker
          </button>

          <button
            className={tab === "saved" ? "nav active" : "nav"}
            onClick={() => setTab("saved")}
          >
            Saved <span className="count">{saved.length}</span>
          </button>

          <button
            className={tab === "reports" ? "nav active" : "nav"}
            onClick={() => setTab("reports")}
          >
            Scam reports
          </button>

          <button
            className={tab === "verification" ? "nav active" : "nav"}
            onClick={() => setTab("verification")}
          >
            Verify opportunities
          </button>
        </nav>

        <span className="header-note">
          Made for opportunity seekers
        </span>
      </header>

      <main>
        {/* Hero section */}
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse"></span>
              YOUR NEXT STEP STARTS HERE
            </div>

            <h1>
              Find opportunities.
              <br />
              <em>Move forward</em> with confidence.
            </h1>

            <p>
              Explore jobs, internships, scholarships and training
              opportunities — and learn to spot warning signs before
              you respond.
            </p>

            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => setTab("opportunities")}
              >
                Explore opportunities <span>↗</span>
              </button>

              <button
                className="button secondary"
                onClick={() => setTab("checker")}
              >
                Check an advert
              </button>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>

            <div className="floating-card card-top">
              <span className="mini-icon">✦</span>
              <div>
                <strong>New possibilities</strong>
                <small>One step at a time</small>
              </div>
            </div>

            <div className="main-illustration">
              <div className="sun"></div>
              <div className="hill hill-back"></div>
              <div className="hill hill-front"></div>
              <div className="path"></div>
              <div className="sprout">✳</div>
            </div>

            <div className="floating-card card-bottom">
              <span className="shield">✓</span>
              <div>
                <strong>Think before you click</strong>
                <small>Check the warning signs</small>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="trust-strip">
          <div>
            <span className="strip-icon">⌕</span>
            <span>
              <strong>Discover</strong>
              <small>Explore opportunities</small>
            </span>
          </div>

          <div>
            <span className="strip-icon">◈</span>
            <span>
              <strong>Assess</strong>
              <small>Review warning signs</small>
            </span>
          </div>

          <div>
            <span className="strip-icon">↗</span>
            <span>
              <strong>Keep moving</strong>
              <small>Track your next steps</small>
            </span>
          </div>
        </section>

        {/* Public opportunities page */}
        {tab === "opportunities" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">EXPLORE WHAT'S NEXT</div>
                <h2>Opportunities for you</h2>
                <p>
                  Browse listings and save the ones you want to follow
                  up on.
                </p>
              </div>

              <span className="results-count">
                {visible.length} listings
              </span>
            </div>

            <div className="filters">
              <label className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, organisation..."
                />
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter category"
              >
                <option value="ALL">All categories</option>
                <option value="JOB">Jobs</option>
                <option value="INTERNSHIP">Internships</option>
                <option value="SCHOLARSHIP">Scholarships</option>
                <option value="TRAINING">Training</option>
                <option value="VOLUNTEERING">Volunteering</option>
                <option value="GRANT">Grants</option>
                <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                <option value="FELLOWSHIP">Fellowships</option>
                <option value="COMPETITION">Competitions</option>
              </select>
            </div>

            {loading ? (
              <div className="empty-state">
                Loading opportunities…
              </div>
            ) : apiError ? (
              <div className="notice error">
                {apiError}
                <br />
                <small>API address: localhost:5000</small>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-state">
                <span>✳</span>
                <h3>No matching opportunities yet</h3>
                <p>
                  Try another search, or add listings using your backend.
                </p>
              </div>
            ) : (
              <div className="opportunity-grid">
                {visible.map((item) => (
                  <article className="opportunity-card" key={item.id}>
                    <div className="card-meta">
                      <span className="category-pill">
                        {item.category}
                      </span>

                      <button
                        className={
                          saved.includes(item.id)
                            ? "save-button saved"
                            : "save-button"
                        }
                        onClick={() => toggleSaved(item.id)}
                        aria-label={
                          saved.includes(item.id)
                            ? "Unsave opportunity"
                            : "Save opportunity"
                        }
                      >
                        {saved.includes(item.id) ? "♥" : "♡"}
                      </button>
                    </div>

                    <h3>{item.title}</h3>
                    <p className="organisation">{item.organisation}</p>

                    <p className="description">
                      {item.description || "No description provided."}
                    </p>

                    <div className="card-footer">
                      <span className="verification">
                        {verificationLabel(item.verification_status)}
                      </span>

                      {item.deadline && (
                        <span className="deadline">
                          Deadline:{" "}
                          {new Date(
                            `${String(item.deadline).slice(0, 10)}T00:00:00`
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {item.application_url && (
                      <a
                        className="text-link"
                        href={item.application_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View opportunity ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}

            <p className="small-disclaimer">
              Always verify details with the original organisation before
              applying or sharing personal information.
            </p>
          </section>
        )}

        {/* Scam checker and community reporting */}
        {tab === "checker" && (
          <section className="content-section checker-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">
                  PAUSE. CHECK. THEN DECIDE.
                </div>
                <h2>Check an advertisement</h2>
                <p>
                  Paste the text of a job, scholarship or online earning
                  advert to look for common warning signs.
                </p>
              </div>
            </div>

            <div className="checker-layout">
              <form
                className="checker-form"
                onSubmit={checkAdvertisement}
              >
                <label htmlFor="advert">Advertisement text</label>

                <textarea
                  id="advert"
                  value={adText}
                  onChange={(event) => {
                    setAdText(event.target.value);
                    setReportStatus("");
                  }}
                  minLength={10}
                  maxLength={10000}
                  required
                  placeholder="Paste the advertisement here…"
                />

                <div className="textarea-foot">
                  <span>{adText.length}/10,000 characters</span>
                  <span>Don't include private account details.</span>
                </div>

                <button
                  className="button primary"
                  type="submit"
                  disabled={checking || adText.trim().length < 10}
                >
                  {checking
                    ? "Checking…"
                    : "Check for warning signs →"}
                </button>

                {checkerError && (
                  <div className="notice error">{checkerError}</div>
                )}
              </form>

              <aside className="checker-side">
                <div className="shield-large">✓</div>
                <h3>A helpful second look</h3>
                <p>
                  ZFind checks for patterns such as upfront payment
                  requests, pressure tactics and unusually strong
                  income promises.
                </p>
                <div className="side-rule"></div>
                <p className="side-small">
                  No automated check can guarantee an advert is safe
                  or prove it is a scam. Verify the employer independently.
                </p>
              </aside>
            </div>

            {/* Assessment result */}
            {analysis && (
              <div
                className={`analysis-result risk-${String(
                  analysis.risk_level || "low"
                ).toLowerCase()}`}
              >
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">ASSESSMENT RESULT</span>
                    <h3>
                      {analysis.risk_level} level of warning signs
                    </h3>
                  </div>
                  <span className="risk-badge">{analysis.risk_level}</span>
                </div>

                {analysis.findings && analysis.findings.length > 0 ? (
                  <ul>
                    {analysis.findings.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No matching warning patterns were detected by the
                    basic checker. This does not mean the advertisement
                    is genuine.
                  </p>
                )}

                <p className="small-disclaimer">
                  {analysis.disclaimer}
                </p>
              </div>
            )}

            {/* Community scam report form */}
            <div className="analysis-result">
              <div className="result-heading">
                <div>
                  <span className="eyebrow">COMMUNITY SAFETY</span>
                  <h3>Report a suspicious advert</h3>
                </div>
              </div>

              <p>
                Submit a suspicious advertisement for review. Reports
                are not proof of fraud and should be reviewed before
                any public warning is issued.
              </p>

              <form
                className="checker-form"
                onSubmit={submitScamReport}
              >
                <label htmlFor="report-notes">
                  Additional information (optional)
                </label>

                <textarea
                  id="report-notes"
                  value={reportNotes}
                  onChange={(event) => setReportNotes(event.target.value)}
                  maxLength={2000}
                  placeholder="Where did you find this advert? Did anyone ask you to pay?"
                />

                <label htmlFor="report-email">
                  Email address (optional)
                </label>

                <input
                  id="report-email"
                  type="email"
                  value={reportEmail}
                  onChange={(event) => setReportEmail(event.target.value)}
                  maxLength={150}
                  placeholder="you@example.com"
                />

                <p className="small-disclaimer">
                  The advertisement currently in the checker will be
                  submitted with your notes. Do not include passwords
                  or PINs.
                </p>

                <button
                  className="button primary"
                  type="submit"
                  disabled={reporting || adText.trim().length < 10}
                >
                  {reporting
                    ? "Submitting…"
                    : "Submit community report"}
                </button>

                {reportStatus && (
                  <div
                    className="notice"
                    role="status"
                    aria-live="polite"
                  >
                    {reportStatus}
                  </div>
                )}
              </form>
            </div>
          </section>
        )}

        {/* Admin scam reports */}
        {tab === "reports" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">COMMUNITY SAFETY</div>
                <h2>Scam reports</h2>
                <p>
                  Review community-submitted adverts and update their
                  review status. A report is an allegation, not proof
                  of fraud.
                </p>
              </div>

              <span className="results-count">
                {scamReports.length} reports
              </span>
            </div>

            {!adminToken ? (
              <div
                className="analysis-result"
                style={{ maxWidth: "520px", margin: "0 auto" }}
              >
                <div className="result-heading">
                  <div>
                    <span className="eyebrow">RESTRICTED AREA</span>
                    <h3>Administrator login</h3>
                  </div>
                  <span className="shield-large">✓</span>
                </div>

                <p>
                  Sign in with your ZFind administrator credentials to
                  review community reports and manage verification.
                </p>

                <form
                  className="checker-form"
                  onSubmit={loginAdministrator}
                >
                  <label htmlFor="admin-username">
                    Administrator username
                  </label>

                  <input
                    id="admin-username"
                    type="text"
                    value={adminUsername}
                    onChange={(event) =>
                      setAdminUsername(event.target.value)
                    }
                    autoComplete="username"
                    required
                  />

                  <label htmlFor="admin-password">Password</label>

                  <input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(event) =>
                      setAdminPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    className="button primary"
                    type="submit"
                    disabled={
                      adminLoginLoading ||
                      !adminUsername.trim() ||
                      !adminPassword
                    }
                  >
                    {adminLoginLoading
                      ? "Signing in…"
                      : "Sign in securely →"}
                  </button>

                  {adminLoginError && (
                    <div className="notice error" role="alert">
                      {adminLoginError}
                    </div>
                  )}
                </form>

                <p className="small-disclaimer">
                  Your session expires after two hours. Log out when
                  finished using the administrator dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className="report-tools">
                  <div className="report-stat-grid">
                    <div className="report-stat">
                      <span>Total reports</span>
                      <strong>{scamReports.length}</strong>
                    </div>

                    <div className="report-stat">
                      <span>Pending</span>
                      <strong>{pendingReports}</strong>
                    </div>

                    <div className="report-stat">
                      <span>Under review</span>
                      <strong>{reviewingReports}</strong>
                    </div>

                    <div className="report-stat">
                      <span>Resolved</span>
                      <strong>{resolvedReports}</strong>
                    </div>
                  </div>

                  <div className="filters report-filters">
                    <label className="search-box">
                      <span>⌕</span>
                      <input
                        type="text"
                        value={reportSearch}
                        onChange={(event) =>
                          setReportSearch(event.target.value)
                        }
                        placeholder="Search reports, email or ID..."
                        aria-label="Search scam reports"
                      />
                    </label>

                    <select
                      value={reportFilter}
                      onChange={(event) =>
                        setReportFilter(event.target.value)
                      }
                      aria-label="Filter reports by status"
                    >
                      <option value="ALL">All statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNDER REVIEW">Under review</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <div className="report-toolbar-footer">
                    <span>
                      Showing {filteredScamReports.length} of{" "}
                      {scamReports.length} reports
                    </span>

                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setReportSearch("");
                        setReportFilter("ALL");
                      }}
                    >
                      Clear filters
                    </button>

                    <button
                      className="button secondary"
                      onClick={logoutAdministrator}
                      type="button"
                    >
                      Log out
                    </button>
                  </div>
                </div>

                {reportsLoading ? (
                  <div className="empty-state">
                    Loading scam reports…
                  </div>
                ) : reportsError ? (
                  <div className="notice error" role="alert">
                    {reportsError}
                  </div>
                ) : filteredScamReports.length === 0 ? (
                  <div className="empty-state">
                    <span>✓</span>
                    <h3>
                      {scamReports.length === 0
                        ? "No reports yet"
                        : "No matching reports"}
                    </h3>
                    <p>
                      {scamReports.length === 0
                        ? "Submitted community reports will appear here."
                        : "Try changing your search or clearing the filters."}
                    </p>
                  </div>
                ) : (
                  <div className="opportunity-grid">
                    {filteredScamReports.map((report) => (
                      <article
                        className="opportunity-card"
                        key={report.id}
                      >
                        <div className="card-meta">
                          <span className="category-pill">
                            Report #{report.id}
                          </span>
                          <span className="verification">
                            {report.status || "PENDING"}
                          </span>
                        </div>

                        <h3>Reported advertisement</h3>

                        <p
                          className="description"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {report.advertisement_text}
                        </p>

                        {report.user_notes && (
                          <>
                            <p className="organisation">Reporter notes</p>
                            <p
                              className="description"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {report.user_notes}
                            </p>
                          </>
                        )}

                        <p className="organisation">
                          Reporter email:{" "}
                          {report.reporter_email || "Not provided"}
                        </p>

                        <p className="small-disclaimer">
                          Submitted:{" "}
                          {report.created_at
                            ? new Date(report.created_at).toLocaleString()
                            : "Date unavailable"}
                        </p>

                        <label htmlFor={`report-status-${report.id}`}>
                          Review status
                        </label>

                        <select
                          id={`report-status-${report.id}`}
                          value={report.status || "PENDING"}
                          disabled={updatingReportId === report.id}
                          onChange={(event) =>
                            updateScamReportStatus(
                              report.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="PENDING">Pending</option>
                          <option value="UNDER REVIEW">Under review</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>

                        {updatingReportId === report.id && (
                          <p className="small-disclaimer">
                            Updating status…
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                {reportsMessage && (
                  <div
                    className="notice"
                    role="status"
                    aria-live="polite"
                  >
                    {reportsMessage}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Admin opportunity verification dashboard */}
        {tab === "verification" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">LISTING QUALITY CONTROL</div>
                <h2>Verify opportunities</h2>
                <p>
                  Review opportunity sources and update their verification
                  status.
                </p>
              </div>

              <span className="results-count">
                {opportunities.length} listings
              </span>
            </div>

            {!adminToken ? (
              <div className="analysis-result">
                <h3>Administrator login required</h3>
                <p>
                  Sign in before reviewing or changing opportunity
                  verification statuses.
                </p>
                <button
                  className="button primary"
                  onClick={() => setTab("reports")}
                >
                  Go to administrator login →
                </button>
              </div>
            ) : (
              <>
                <div className="report-stat-grid">
                  <div className="report-stat">
                    <span>Unverified</span>
                    <strong>{unverifiedOpportunities}</strong>
                  </div>

                  <div className="report-stat">
                    <span>Verified</span>
                    <strong>{verifiedOpportunities}</strong>
                  </div>

                  <div className="report-stat">
                    <span>Rejected</span>
                    <strong>{rejectedOpportunities}</strong>
                  </div>
                </div>

                <div className="filters">
                  <label className="search-box">
                    <span>⌕</span>
                    <input
                      value={opportunitySearch}
                      onChange={(event) =>
                        setOpportunitySearch(event.target.value)
                      }
                      placeholder="Search title or organisation..."
                      aria-label="Search opportunities to verify"
                    />
                  </label>

                  <select
                    value={verificationFilter}
                    onChange={(event) =>
                      setVerificationFilter(event.target.value)
                    }
                    aria-label="Filter verification status"
                  >
                    <option value="UNVERIFIED">Unverified</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All statuses</option>
                  </select>
                </div>

                {verificationError && (
                  <div className="notice error" role="alert">
                    {verificationError}
                  </div>
                )}

                {verificationMessage && (
                  <div className="notice" role="status">
                    {verificationMessage}
                  </div>
                )}

                {loading ? (
                  <div className="empty-state">
                    Loading opportunities…
                  </div>
                ) : apiError ? (
                  <div className="notice error">{apiError}</div>
                ) : filteredVerificationOpportunities.length === 0 ? (
                  <div className="empty-state">
                    <span>✓</span>
                    <h3>No matching opportunities</h3>
                    <p>
                      Try another search or select a different status.
                    </p>
                  </div>
                ) : (
                  <div className="opportunity-grid">
                    {filteredVerificationOpportunities.map((item) => (
                      <article
                        className="opportunity-card"
                        key={item.id}
                      >
                        <div className="card-meta">
                          <span className="category-pill">
                            {item.category}
                          </span>
                          <span className="verification">
                            {item.verification_status || "UNVERIFIED"}
                          </span>
                        </div>

                        <h3>{item.title}</h3>
                        <p className="organisation">
                          {item.organisation}
                        </p>

                        <p className="description">
                          {item.description || "No description provided."}
                        </p>

                        {item.source_url && (
                          <p>
                            <a
                              className="text-link"
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Review original source ↗
                            </a>
                          </p>
                        )}

                        {item.application_url && (
                          <p>
                            <a
                              className="text-link"
                              href={item.application_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Review application page ↗
                            </a>
                          </p>
                        )}

                        <label htmlFor={`verification-${item.id}`}>
                          Verification status
                        </label>

                        <select
                          id={`verification-${item.id}`}
                          value={item.verification_status || "UNVERIFIED"}
                          disabled={updatingOpportunityId === item.id}
                          onChange={(event) =>
                            updateOpportunityVerification(
                              item.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="UNVERIFIED">Unverified</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="REJECTED">Rejected</option>
                        </select>

                        {updatingOpportunityId === item.id && (
                          <p className="small-disclaimer">
                            Updating status…
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                <div className="report-toolbar-footer">
                  <span>
                    Showing {filteredVerificationOpportunities.length} of{" "}
                    {opportunities.length} listings
                  </span>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setOpportunitySearch("");
                      setVerificationFilter("UNVERIFIED");
                      setVerificationMessage("");
                      setVerificationError("");
                    }}
                  >
                    Reset filters
                  </button>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={loadOpportunities}
                  >
                    Refresh listings
                  </button>

                  <button
                    type="button"
                    className="button secondary"
                    onClick={logoutAdministrator}
                  >
                    Log out
                  </button>
                </div>

                <p className="small-disclaimer">
                  Verify the organisation, original source and application
                  details before marking a listing as verified. Verification
                  is not a guarantee that an opportunity is risk-free.
                </p>
              </>
            )}
          </section>
        )}

        {/* Saved opportunities */}
        {tab === "saved" && (
          <section className="content-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR SHORTLIST</div>
                <h2>Saved opportunities</h2>
                <p>
                  Your saved listings are stored in this browser for
                  this demo.
                </p>
              </div>
            </div>

            {!savedItems.length ? (
              <div className="empty-state">
                <span>♡</span>
                <h3>Nothing saved yet</h3>
                <p>
                  Browse opportunities and tap the heart to save one here.
                </p>

                <button
                  className="button primary"
                  onClick={() => setTab("opportunities")}
                >
                  Explore opportunities
                </button>
              </div>
            ) : (
              <div className="opportunity-grid">
                {savedItems.map((item) => (
                  <article
                    className="opportunity-card"
                    key={item.id}
                  >
                    <div className="card-meta">
                      <span className="category-pill">
                        {item.category}
                      </span>

                      <button
                        className="save-button saved"
                        onClick={() => toggleSaved(item.id)}
                        aria-label="Unsave opportunity"
                      >
                        ♥
                      </button>
                    </div>

                    <h3>{item.title}</h3>
                    <p className="organisation">{item.organisation}</p>

                    <p className="description">
                      {item.description || "No description provided."}
                    </p>

                    <p className="verification">
                      {verificationLabel(item.verification_status)}
                    </p>

                    {item.application_url && (
                      <a
                        className="text-link"
                        href={item.application_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View opportunity ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer>
        <a
          className="brand footer-brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setTab("opportunities");
          }}
        >
          <span className="brand-mark">Z</span>
          <span>ZFind</span>
        </a>

        <p>More informed choices. More possibilities.</p>

        <span className="footer-tag">
          EARLY PROTOTYPE · NOT A FRAUD VERIFICATION SERVICE
        </span>
      </footer>
    </div>
  );
}

export default App;
