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




