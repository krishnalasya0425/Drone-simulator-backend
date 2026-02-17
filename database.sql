-- ============================================
-- DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS drone_simulator;
USE drone_simulator;

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
-- CLASS INSTRUCTORS (Multiple Instructors Support)
-- ============================================
CREATE TABLE class_instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    instructor_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_instructor (class_id, instructor_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_class_instructors_class_id ON class_instructors(class_id);
CREATE INDEX idx_class_instructors_instructor_id ON class_instructors(instructor_id);

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
    total_pages INT DEFAULT NULL,
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





 CREATE TABLE subtopics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subtopic_name VARCHAR(255) NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES subtopics(id) ON DELETE CASCADE
 );

CREATE TABLE student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id INT NOT NULL,
    completed_subtopics JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_class (user_id, class_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_subtopics_class_id ON subtopics(class_id);
CREATE INDEX idx_student_progress_user_id ON student_progress(user_id);
CREATE INDEX idx_student_progress_class_id ON student_progress(class_id);


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

-- ============================================
-- DRONE TRAINING MODULE SYSTEM
-- ============================================

-- Drone Categories (FPV, Surveillance, Payload)
CREATE TABLE IF NOT EXISTS drone_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Training Modules (Introduction, Tutorial, Intermediate, Obstacle Course, Advanced, Maintenance)
CREATE TABLE IF NOT EXISTS training_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    drone_category_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (drone_category_id) REFERENCES drone_categories(id) ON DELETE CASCADE,
    INDEX idx_class_category (class_id, drone_category_id)
);

-- Sub-modules (e.g., City, Forest, Desert for Intermediate; Level1, Level2 for Advanced)
CREATE TABLE IF NOT EXISTS training_submodules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    submodule_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
    INDEX idx_module (module_id)
);

-- Sub-sub-modules (e.g., Rain, Fog, Wind for each environment)
CREATE TABLE IF NOT EXISTS training_subsubmodules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submodule_id INT NOT NULL,
    subsubmodule_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submodule_id) REFERENCES training_submodules(id) ON DELETE CASCADE,
    INDEX idx_submodule (submodule_id)
);

-- Student Training Progress with scorecard
CREATE TABLE IF NOT EXISTS student_training_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    drone_category_id INT NOT NULL,
    module_id INT,
    submodule_id INT,
    subsubmodule_id INT,
    completed BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2),
    scorecard_image_path VARCHAR(500),
    completion_data JSON,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (drone_category_id) REFERENCES drone_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE SET NULL,
    FOREIGN KEY (submodule_id) REFERENCES training_submodules(id) ON DELETE SET NULL,
    FOREIGN KEY (subsubmodule_id) REFERENCES training_subsubmodules(id) ON DELETE SET NULL,
    INDEX idx_student_class (student_id, class_id),
    INDEX idx_student_category (student_id, drone_category_id),
    INDEX idx_progress_lookup (student_id, class_id, drone_category_id, module_id, submodule_id, subsubmodule_id)
);


CREATE TABLE IF NOT EXISTS training_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    topic_id INT NULL,
    subtopic_id INT NULL,
    subsubtopic_id INT NULL,
    drone_category_id INT NULL,
    module_id INT NULL,
    submodule_id INT NULL,
    subsubmodule_id INT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME NULL,
    completed BOOLEAN DEFAULT FALSE,
    score FLOAT NULL,
    completion_data JSON NULL,
    scorecard_image_path VARCHAR(500) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_student_class (student_id, class_id),
    INDEX idx_session_start (session_start)
);

-- Insert default drone categories
INSERT INTO drone_categories (category_name, description, display_order) VALUES
('FPV Drone', 'First Person View racing and freestyle drones', 1),
('Surveillance Drone', 'Reconnaissance and monitoring drones', 2),
('Payload Drone', 'Heavy-lift and cargo transport drones', 3)
ON DUPLICATE KEY UPDATE category_name = category_name;
