SET NAMES utf8mb4;

CREATE TABLE organisations (
    organisation_id INT NOT NULL AUTO_INCREMENT,
    organisation_name VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (organisation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO organisations (organisation_id, organisation_name, description, email, phone)
VALUES
    (1, 'Himalayan Hearts Foundation', 'A community-based charity that supports education, community development, environmental conservation and humanitarian projects in Nepal and Himalayan communities.', 'contact@himalayanhearts.org', '08 6123 4567');

CREATE TABLE categories (
    category_id INT NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (category_id, category_name)
VALUES
    (1, 'Fun Run'),
    (2, 'Gala'),
    (3, 'Auction'),
    (4, 'Concert'),
    (5, 'Community'),
    (6, 'Walk');

CREATE TABLE events (
    event_id INT NOT NULL AUTO_INCREMENT,
    organisation_id INT NOT NULL,
    category_id INT NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(150) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    ticket_price DECIMAL(10,2) DEFAULT 0.00,
    fundraising_goal DECIMAL(10,2) DEFAULT 0.00,
    fundraising_progress DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Active',
    suspended TINYINT(1) DEFAULT 0,
    PRIMARY KEY (event_id),
    KEY organisation_id (organisation_id),
    KEY category_id (category_id),
    CONSTRAINT events_ibfk_1 FOREIGN KEY (organisation_id) REFERENCES organisations (organisation_id),
    CONSTRAINT events_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO events (event_id, organisation_id, category_id, event_name, event_date, event_time, location, purpose, description, ticket_price, fundraising_goal, fundraising_progress, status, suspended)
VALUES
    (
        1,
        1,
        1,
        'Himalayan Charity Run',
        '2026-10-18',
        '08:00:00',
        'Kings Park, Perth',
        'Raise funds for educational resources in rural Nepal.',
        'A community fun run bringing people together to support schools and students in remote Himalayan communities.',
        25.00,
        15000.00,
        6250.00,
        'Active',
        0
    ),
    (
        2,
        1,
        2,
        'Nepal Cultural Night',
        '2026-11-07',
        '18:30:00',
        'Perth Town Hall',
        'Raise funds to support education projects in rural Nepal.',
        'An evening celebrating Nepali culture through traditional food, music and performances while raising funds for education projects.',
        45.00,
        20000.00,
        8700.00,
        'Active',
        0
    ),
    (
        3,
        1,
        3,
        'Himalayan Art Auction',
        '2026-11-21',
        '17:00:00',
        'Fremantle Arts Centre',
        'Raise funds for humanitarian and disaster relief projects in Nepal.',
        'A charity auction featuring Himalayan-inspired artwork and handmade items donated to support communities affected by natural disasters.',
        15.00,
        12000.00,
        4900.00,
        'Active',
        0
    ),
    (
        4,
        1,
        4,
        'Sounds of Nepal',
        '2026-12-05',
        '19:00:00',
        'Perth Concert Hall',
        'Support educational opportunities for children in Himalayan communities.',
        'A charity concert featuring Nepali-inspired music and local performers coming together to support education for children in Nepal.',
        35.00,
        25000.00,
        11000.00,
        'Active',
        0
    ),
    (
        5,
        1,
        5,
        'Taste of Nepal Community Day',
        '2027-01-16',
        '11:00:00',
        'Elizabeth Quay, Perth',
        'Bring the community together while supporting development projects in Nepal.',
        'A free community event celebrating Nepali food, culture and traditions with voluntary donations supporting community projects in Nepal.',
        0.00,
        10000.00,
        3200.00,
        'Active',
        0
    ),
    (
        6,
        1,
        6,
        'Walk for Himalayan Education',
        '2027-02-13',
        '09:00:00',
        'South Perth Foreshore',
        'Provide books and learning resources to students in remote Himalayan communities.',
        'A community charity walk raising funds for books, school supplies and educational resources for students in remote areas of Nepal.',
        20.00,
        18000.00,
        5100.00,
        'Active',
        0
    ),
    (
        7,
        1,
        5,
        'Everest Community Fundraiser',
        '2026-08-15',
        '12:00:00',
        'Victoria Park Community Centre',
        'Support health and community projects in remote regions of Nepal.',
        'A community fundraising event supporting basic health services and community development projects in remote Himalayan regions.',
        10.00,
        8000.00,
        8000.00,
        'Past',
        0
    ),
    (
        8,
        1,
        6,
        'Himalayan Conservation Walk',
        '2026-12-19',
        '08:30:00',
        'Kings Park, Perth',
        'Raise awareness and funds for environmental conservation in Himalayan regions.',
        'A community walk focused on environmental awareness and conservation projects protecting Himalayan ecosystems.',
        15.00,
        14000.00,
        2700.00,
        'Suspended',
        1
    );

CREATE TABLE registrations (
    registration_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ticket_quantity INT NOT NULL,
    CONSTRAINT uq_registration_event_email UNIQUE (event_id, email),
    CONSTRAINT fk_registration_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ticket_quantity CHECK (ticket_quantity BETWEEN 1 AND 100),
    INDEX ix_registration_date (event_id, registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO registrations (event_id, full_name, email, phone, registered_at, ticket_quantity)
VALUES
    (1, 'Demo Guest 1', 'guest1@example.com', '0400000001', '2026-10-01 10:00:00', 2),
    (1, 'Demo Guest 2', 'guest2@example.com', '0400000002', '2026-10-02 10:00:00', 3),
    (1, 'Demo Guest 3', 'guest3@example.com', '0400000003', '2026-10-03 10:00:00', 1),
    (1, 'Demo Guest 4', 'guest4@example.com', '0400000004', '2026-10-04 10:00:00', 2),
    (1, 'Demo Guest 5', 'guest5@example.com', '0400000005', '2026-10-05 10:00:00', 3),
    (2, 'Demo Guest 6', 'guest6@example.com', '0400000006', '2026-10-06 10:00:00', 1),
    (2, 'Demo Guest 7', 'guest7@example.com', '0400000007', '2026-10-07 10:00:00', 2),
    (2, 'Demo Guest 8', 'guest8@example.com', '0400000008', '2026-10-08 10:00:00', 3),
    (2, 'Demo Guest 9', 'guest9@example.com', '0400000009', '2026-10-09 10:00:00', 1),
    (2, 'Demo Guest 10', 'guest10@example.com', '0400000010', '2026-10-10 10:00:00', 2);
