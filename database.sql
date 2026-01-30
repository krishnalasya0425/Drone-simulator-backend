
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    regiment VARCHAR(100),
    batch_no VARCHAR(50),
    army_id VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('Student', 'Instructor') NOT NULL ,
    password VARCHAR(255) NOT NULL,
    status ENUM('Pending','Approved', 'Denied') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,

    class_id INT NOT NULL,
    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tests_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_tests_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE test_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) ,
    answer VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);


CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_key VARCHAR(10),    -- A, B, C, D
    option_value TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);


CREATE TABLE test_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,

    test_id INT NOT NULL,
    set_name VARCHAR(100) NOT NULL,

    total_questions INT NOT NULL,

    exam_type ENUM(
        'TIMED',
        'UNTIMED',
        'FIXED_TIME'
    ) NOT NULL,

    PASS_THRESHOLD INT NOT NULL,

    -- For TIMED exams
    duration_minutes INT NULL,

    -- For FIXED_TIME exams
    start_time DATETIME NULL,
    end_time DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,

    -- Safety checks (MySQL 8+)
    CHECK (
        (exam_type = 'TIMED' AND duration_minutes IS NOT NULL)
        OR
        (exam_type = 'UNTIMED')
        OR
        (exam_type = 'FIXED_TIME' AND start_time IS NOT NULL AND end_time IS NOT NULL)
    )
);


CREATE TABLE test_set_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    test_set_id INT NOT NULL,
    test_id INT NOT NULL,
    question_id INT NOT NULL,

    FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);


CREATE TABLE student_test_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,

    test_set_id INT NOT NULL,
    student_id INT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    score INT,
    answers JSON NULL,

    UNIQUE KEY unique_student_test (test_set_id , student_id),

    FOREIGN KEY (test_set_id) REFERENCES test_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);




-- CREATE TABLE test_scores (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     test_id INT NOT NULL,
--     student_id INT NOT NULL,
--     score INT NOT NULL,     
--     total_questions INT NOT NULL,    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--     FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
--     FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
-- );



CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(255) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    instructor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);



CREATE TABLE docs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    doc_title VARCHAR(255),
    file_data LONGBLOB NULL,         -- File binary data (kept as NULL for videos)
    file_type VARCHAR(255) NOT NULL,  -- MIME type
    file_path VARCHAR(500) DEFAULT NULL, -- Path to file on disk
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE assigned_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_assignment (class_id, student_id),

    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE unity_builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    build_type ENUM('practice', 'exercise') NOT NULL,
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
-- INSERT DEFAULT ADMIN USER
-- ============================================
-- This creates a system admin user with ID 0 to support:
-- 1. Hardcoded admin login (admin/admin) in authController.js
-- 2. Foreign key constraints when admin creates classes (created_by = 0)
-- ============================================

SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

INSERT INTO users (id, name, regiment, batch_no, army_id, role, password, status, created_at)
VALUES (
  0,
  'System Admin',
  'Administration',
  'ADMIN',
  'admin',
  'Instructor',  -- Using 'Instructor' as role since ENUM doesn't have 'admin'
  '$2b$10$dummyHashNotUsedForHardcodedAdmin',  -- Password not used (hardcoded login)
  'Approved',
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  name = 'System Admin',
  status = 'Approved';

SET SESSION sql_mode = DEFAULT;


SHOW VARIABLES LIKE 'max_allowed_packet';