# ZFind 🇿🇲
### Find opportunities. Move forward with confidence.

**ZFind** is a web application designed to help opportunity seekers in Zambia discover opportunities and identify potential scams before they apply.

Finding legitimate opportunities can be challenging, especially for students and young people who need reliable information about jobs, internships, scholarships, training programmes, grants, and other opportunities. ZFind brings opportunity discovery and scam awareness together in one platform.

## ✨ Key Features

### 🔎 Opportunity Discovery
- Browse opportunities across different categories.
- Search by opportunity title, organisation, or description.
- Filter opportunities by category.
- Access application links and available deadlines.
- Save opportunities for later.

### ✅ Opportunity Verification
- View verification statuses for listed opportunities.
- Identify listings marked as verified, unverified, or rejected.
- Provide administrators with a way to review and manage listing credibility.

### 🛡️ Scam Checker
- Submit opportunity advertisements for a warning-sign assessment.
- Identify common scam indicators, including upfront fees, unrealistic income promises, and high-pressure tactics.
- Receive a warning level to help make more informed decisions.

### 📢 Community Scam Reporting
- Submit suspicious advertisements for review.
- Include notes and optional contact information.
- Support community awareness by reporting potentially fraudulent opportunities.

### 🔐 Administrative Dashboard
- Administrator login and protected access.
- Review community scam reports.
- Search and filter reports by status.
- Update report statuses.
- Review opportunities and manage their verification statuses.

## 🎯 Purpose

ZFind aims to make opportunity discovery more accessible while encouraging safer, more informed application decisions. The project focuses on the needs of opportunity seekers in Zambia, particularly students and young people exploring education, employment, and career development.

## 🧰 Technologies Used

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MySQL

**Security and supporting tools**
- JSON Web Tokens (JWT) for administrator authentication
- bcryptjs for password hashing
- Browser local storage for saved opportunities
- Git and GitHub for version control

## 🏗️ Project Structure

```text
ZFind/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── db.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

*Note: Local environment files such as `.env` should remain private and must not be committed to GitHub.*

## ⚙️ Getting Started

### Prerequisites

Install the following:
- [Node.js](https://nodejs.org/)
- [MySQL](https://dev.mysql.com/downloads/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/ZFind.git
cd ZFind
```

Replace `YOUR-GITHUB-USERNAME` with the GitHub account that owns the repository.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder and configure the required database connection settings, administrator credentials, and JWT secret. Use the variable names expected by the backend source code.

### 3. Configure the database

Create the MySQL database named `mwayi_db` and configure its tables to match the application's database schema.

Keep your database credentials private. Do not commit the `.env` file.

### 4. Start the backend

From the backend directory, run the development command configured in `package.json`, for example:

```bash
npm run dev
```

The backend is configured to use port `5000` by default.

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Open the local address displayed by Vite in your terminal, usually `http://localhost:5173`.

**Note:** The frontend API address and backend configuration must match your environment. The deployed application will require a publicly accessible backend and database.

## 🔒 Security and Responsible Use

- Verification labels should not be treated as an absolute guarantee that an opportunity is legitimate.
- Scam-checking results are assessments of warning signs, not definitive legal or fraud determinations.
- Users should independently confirm opportunities through official organisational websites and trusted contact channels.
- Administrator credentials, database passwords, and JWT secrets must be kept out of source control.
- A production deployment should use HTTPS, secure environment variables, and appropriate access controls.

## 🚀 Future Improvements

Planned improvements may include:
- Public deployment and a production database.
- User accounts and personalised opportunity tracking.
- Deadline reminders and notifications.
- More comprehensive opportunity verification.
- Expanded reporting and analytics.
- Improved mobile responsiveness and accessibility.
- Additional opportunities relevant to Zambian students and young professionals.

## 👩🏽‍💻 Project Status

**Current stage:** Working prototype.

ZFind is under active development. Features, security controls, and deployment configuration may evolve as the project improves.

## 🤝 Contributions

Suggestions, feedback, and contributions that improve opportunity accessibility, usability, and online safety are welcome.

## 📄 License

No open-source license has been selected yet. Unless a license is added, the repository should not be assumed to grant permission to reuse, distribute, or modify the code.

---

**ZFind — Made for opportunity seekers.**