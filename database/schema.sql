CREATE DATABASE IF NOT EXISTS mwayi_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mwayi_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  organisation VARCHAR(150) NOT NULL,
  description TEXT,
  category ENUM('JOB','INTERNSHIP','SCHOLARSHIP','TRAINING','OTHER') DEFAULT 'OTHER',
  application_url VARCHAR(500),
  deadline DATE,
  source_url VARCHAR(500),
  verification_status ENUM('UNVERIFIED','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_opportunities (
  user_id INT NOT NULL,
  opportunity_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, opportunity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  opportunity_id INT NOT NULL,
  status ENUM('SAVED','APPLIED','INTERVIEW','REJECTED','ACCEPTED') DEFAULT 'SAVED',
  applied_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_opportunity (user_id, opportunity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scam_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advertisement_text TEXT NOT NULL,
  reporter_email VARCHAR(150) NULL,
  user_notes TEXT NULL,
  status ENUM('NEW','UNDER_REVIEW','CONFIRMED','DISMISSED') DEFAULT 'NEW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scam_analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advertisement_text TEXT NOT NULL,
  risk_level ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  findings JSON NULL,
  disclaimer VARCHAR(500) NOT NULL DEFAULT 'This assessment is advisory and does not prove whether an opportunity is fraudulent.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
