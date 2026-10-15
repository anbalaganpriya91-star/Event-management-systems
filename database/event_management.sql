-- =========================================================
-- Event Management System - Database Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS event_management_system;
USE event_management_system;

-- ---------------------------------------------------------
-- USERS TABLE (Authentication)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- VENUES TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
    amenities TEXT,
    status ENUM('available','unavailable') NOT NULL DEFAULT 'available',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- PARTICIPANTS TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_participant_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- EVENTS TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(80),
    venue_id INT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    organizer_name VARCHAR(120),
    ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_seats INT NOT NULL DEFAULT 0,
    status ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- BOOKINGS TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    event_id INT NOT NULL,
    participant_id INT NOT NULL,
    venue_id INT NOT NULL,
    num_tickets INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    booking_status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
    booked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- PAYMENTS TABLE (Payment Workflow)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(40) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','card','upi','bank_transfer') NOT NULL DEFAULT 'cash',
    payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- DEFAULT ADMIN USER  (email: admin@ems.com / password: Admin@123)
-- ---------------------------------------------------------
INSERT INTO users (full_name, email, password, role) VALUES
('System Admin', 'admin@ems.com', '$2b$10$3uKJcfYeqptqgtph0cJGNuqTR/aRU2SNmWlxZ4HyXewIh2ajJlGO.', 'admin');
-- NOTE: hash above corresponds to password "Admin@123" (bcrypt, verifiable via PHP's password_verify()). Change it after first login.

-- ---------------------------------------------------------
-- SAMPLE VENUES
-- ---------------------------------------------------------
INSERT INTO venues (name, location, capacity, price_per_day, amenities, status, created_by) VALUES
('Grand Ballroom', 'Chennai, T. Nagar', 500, 25000.00, 'AC, Stage, Sound System, Parking', 'available', 1),
('Riverside Convention Center', 'Coimbatore', 800, 40000.00, 'AC, Projector, Catering, Parking', 'available', 1),
('Skyline Rooftop', 'Bengaluru, MG Road', 150, 15000.00, 'Open Air, Lighting, Bar Setup', 'available', 1);

-- ---------------------------------------------------------
-- SAMPLE PARTICIPANTS
-- ---------------------------------------------------------
INSERT INTO participants (name, email, phone, address) VALUES
('Arun Kumar', 'arun.kumar@example.com', '9840012345', 'Chennai'),
('Divya Sri', 'divya.sri@example.com', '9940098765', 'Coimbatore'),
('Karthik R', 'karthik.r@example.com', '9003344556', 'Bengaluru');

-- ---------------------------------------------------------
-- SAMPLE EVENTS
-- ---------------------------------------------------------
INSERT INTO events (name, description, category, venue_id, event_date, start_time, end_time, organizer_name, ticket_price, total_seats, status, created_by) VALUES
('Tech Conclave 2026', 'Annual technology and innovation summit', 'Conference', 1, '2026-11-15', '09:00:00', '18:00:00', 'TechHub Events', 999.00, 500, 'upcoming', 1),
('Music Fiesta Night', 'Live music concert featuring regional artists', 'Concert', 3, '2026-10-20', '18:00:00', '23:00:00', 'SoundWave Productions', 1499.00, 150, 'upcoming', 1),
('Startup Meetup', 'Networking event for startup founders and investors', 'Networking', 2, '2026-10-05', '10:00:00', '14:00:00', 'StartUp Circle', 499.00, 200, 'upcoming', 1);
