CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    regiment VARCHAR(100),
    batch_no VARCHAR(50),
    army_id VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('Student', 'Instructor') NOT NULL ,
    password VARCHAR(255) NOT NULL,
    status ENUM('Approved', 'Denied') NOT NULL DEFAULT 'Denied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


CREATE TABLE test_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT NOT NULL,     
    total_questions INT NOT NULL,    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE docs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    doc_title VARCHAR(255),
    file_data LONGBLOB NOT NULL,     -- File binary data
    file_type VARCHAR(255) NOT NULL,  -- MIME type (pdf, png, jpg, etc.)
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);








