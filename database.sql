-- ============================================
-- DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS map_reading;
USE map_reading;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    `rank` VARCHAR(50) NOT NULL,
    unit VARCHAR(100),
    course_no VARCHAR(50),
    army_no VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('Student', 'Instructor') NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('Pending','Approved','Denied') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- CLASSES
-- ============================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    instructor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- ASSIGNED CLASSES
-- ============================================
CREATE TABLE assigned_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment (class_id, student_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TESTS
-- ============================================
CREATE TABLE tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    created_by INT NOT NULL,
    individual_student_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (individual_student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TEST QUESTIONS
-- ============================================
CREATE TABLE test_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50),
    answer VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- ============================================
-- QUESTION OPTIONS
-- ============================================
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_key VARCHAR(10),
    option_value TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

-- ============================================
-- TEST SETS
-- ============================================
CREATE TABLE test_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    set_name VARCHAR(100) NOT NULL,
    total_questions INT NOT NULL,
    exam_type ENUM('TIMED','UNTIMED','FIXED_TIME') NOT NULL,
    pass_threshold INT NOT NULL,
    duration_minutes INT,
    start_time DATETIME,
    end_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- ============================================
-- TEST SET QUESTIONS
-- ============================================
CREATE TABLE test_set_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_set_id INT NOT NULL,
    test_id INT NOT NULL,
    question_id INT NOT NULL,
    FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

-- ============================================
-- STUDENT TEST SETS
-- ============================================
CREATE TABLE student_test_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_set_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    score INT,
    answers JSON,
    UNIQUE KEY unique_student_test (test_set_id, student_id),
    FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE docs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    doc_title VARCHAR(255),
    file_data LONGBLOB,
    file_type VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ============================================
-- UNITY BUILDS (FIXES YOUR ERROR)
-- ============================================
CREATE TABLE unity_builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    build_type ENUM('practice','exercise') NOT NULL,
    build_path VARCHAR(500) NOT NULL,
    build_name VARCHAR(255),
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_build (class_id, build_type),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- OTP VERIFICATIONS
-- ============================================
CREATE TABLE otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- STUDENT DOCUMENT PROGRESS
-- ============================================
CREATE TABLE student_document_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    doc_id INT NOT NULL,
    class_id INT NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    total_pages INT,
    pages_read INT,
    view_duration_seconds INT DEFAULT 0,
    video_duration_seconds INT,
    video_watched_seconds INT,
    first_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_access_count INT DEFAULT 0,
    UNIQUE KEY unique_student_doc (student_id, doc_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doc_id) REFERENCES docs(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ============================================
-- STUDENT CLASS PROGRESS
-- ============================================
CREATE TABLE student_class_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    overall_completion_percentage DECIMAL(5,2) DEFAULT 0,
    pdf_completion_percentage DECIMAL(5,2) DEFAULT 0,
    image_completion_percentage DECIMAL(5,2) DEFAULT 0,
    video_completion_percentage DECIMAL(5,2) DEFAULT 0,
    total_documents INT DEFAULT 0,
    completed_documents INT DEFAULT 0,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_class (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ============================================
-- RETEST REQUESTS
-- ============================================
CREATE TABLE retest_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    test_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    attempted_at TIMESTAMP NULL,
    status ENUM('Pending','Approved','Completed','Denied') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    instructor_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- SYSTEM ADMIN USER (ID = 0)
-- ============================================
SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO users (id, name, `rank`, unit, course_no, army_no, role, password, status)
VALUES (
    0,
    'System Admin',
    'ADMIN',
    'Administration',
    'ADMIN',
    'admin',
    'Instructor',
    '$2b$10$dummyHashNotUsedForHardcodedAdmin',
    'Approved'
)
ON DUPLICATE KEY UPDATE status='Approved';

SET SESSION sql_mode = DEFAULT;