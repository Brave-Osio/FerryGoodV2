-- ============================================================
-- FERRY GOOD — Sample Seed Data
-- Execute after creating schema tables
-- Note: Passwords shown are bcrypt hashes of the plain-text defaults
-- ============================================================

-- ============================================================
-- USERS (passwords hashed with bcrypt rounds=12)
-- Plain: Admin@123, Register@123, Client@123
-- ============================================================
INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2ag2VUkHGy', 'System Administrator', 'admin@ferrygood.ph', 'admin');

INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES ('register_staff', '$2b$12$oBvTCHoNzVVOatMb9a3EYumacXN0dvx0KFhSwBiYTvxN3TnDQJNYu', 'Registration Staff', 'register@ferrygood.ph', 'register');

INSERT INTO Users (Username, PasswordHash, FullName, Email, Role)
VALUES ('client_user', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uDGmBi.Gi', 'Client User', 'client@ferrygood.ph', 'client');

-- ============================================================
-- PORTS
-- ============================================================
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Batangas Port', 'BTG', 'Batangas City', 'Batangas');
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Puerto Galera Port', 'PGP', 'Puerto Galera', 'Oriental Mindoro');
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Calapan Port', 'CLP', 'Calapan City', 'Oriental Mindoro');
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Odiongan Port', 'ODN', 'Odiongan', 'Romblon');
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Romblon Port', 'RBL', 'Romblon', 'Romblon');
INSERT INTO Ports (PortName, PortCode, City, Province) VALUES ('Roxas Port (Mindoro)', 'RXS', 'Roxas', 'Oriental Mindoro');

-- ============================================================
-- FERRIES
-- ============================================================
INSERT INTO Ferries (FerryName, FerryCode, Capacity, FerryType, Description)
VALUES ('MV Sta. Ana', 'MVSA', 250, 'RoRo', 'Roll-on/Roll-off passenger ferry with vehicle deck. Standard class seating for 250 passengers.');

INSERT INTO Ferries (FerryName, FerryCode, Capacity, FerryType, Description)
VALUES ('SuperCat 6', 'SC06', 180, 'FastCraft', 'High-speed catamaran ferry. Air-conditioned with business and economy class seating.');

INSERT INTO Ferries (FerryName, FerryCode, Capacity, FerryType, Description)
VALUES ('MV Island Queen', 'MVIQ', 300, 'Passenger', 'Large passenger vessel with cafeteria and promenade deck. Suitable for overnight routes.');

INSERT INTO Ferries (FerryName, FerryCode, Capacity, FerryType, Description)
VALUES ('FastCat M7', 'FCM7', 150, 'FastCraft', 'Modern fast craft with premium seating and onboard amenities.');

INSERT INTO Ferries (FerryName, FerryCode, Capacity, FerryType, Description)
VALUES ('MV Mindoro Express', 'MVME', 200, 'RoRo', 'Daily workhorse ferry on the Batangas-Calapan route.');

-- ============================================================
-- ROUTES
-- ============================================================
INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (1, 2, 'BTG-PGP', 42.5, 90);  -- Batangas → Puerto Galera

INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (2, 1, 'PGP-BTG', 42.5, 90);  -- Puerto Galera → Batangas

INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (1, 3, 'BTG-CLP', 86.0, 120); -- Batangas → Calapan

INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (3, 1, 'CLP-BTG', 86.0, 120); -- Calapan → Batangas

INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (1, 4, 'BTG-ODN', 165.0, 300); -- Batangas → Odiongan

INSERT INTO Routes (OriginPortID, DestPortID, RouteCode, DistanceKM, EstDurationMin)
VALUES (4, 1, 'ODN-BTG', 165.0, 300); -- Odiongan → Batangas

-- ============================================================
-- SCHEDULES (upcoming departures)
-- ============================================================
INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (2, 1, '2026-03-17 06:00:00', '2026-03-17 07:30:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (1, 3, '2026-03-17 07:00:00', '2026-03-17 09:00:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (2, 2, '2026-03-17 10:00:00', '2026-03-17 11:30:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (5, 3, '2026-03-17 12:00:00', '2026-03-17 14:00:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (4, 1, '2026-03-17 14:00:00', '2026-03-17 15:30:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (3, 5, '2026-03-17 18:00:00', '2026-03-17 23:00:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (1, 4, '2026-03-18 06:00:00', '2026-03-18 08:00:00', 'scheduled', 1);

INSERT INTO Schedules (FerryID, RouteID, DepartureTime, ArrivalTime, Status, CreatedByID)
VALUES (2, 1, '2026-03-18 09:00:00', '2026-03-18 10:30:00', 'scheduled', 1);

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Maria', 'Santos', 'maria.santos@email.com', '09171234567', 'PhilSys', 'PSN-1234-5678-9012', 'Filipino', 'Female', 1);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Juan', 'dela Cruz', 'juan.delacruz@email.com', '09181234567', 'Passport', 'XX1234567', 'Filipino', 'Male', 1);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Ana', 'Reyes', 'ana.reyes@email.com', '09191234567', 'DriversLicense', 'N03-12-345678', 'Filipino', 'Female', 1);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Pedro', 'Garcia', 'pedro.garcia@email.com', '09201234567', 'UMID', 'UMID-0001-2345-6789', 'Filipino', 'Male', 1);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Luisa', 'Martinez', 'luisa.martinez@email.com', '09211234567', 'PhilSys', 'PSN-9876-5432-1098', 'Filipino', 'Female', 2);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Jose', 'Bautista', 'jose.bautista@email.com', '09221234567', 'Passport', 'PP9876543', 'Filipino', 'Male', 2);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Carmen', 'Villanueva', 'carmen.v@email.com', '09231234567', 'PhilSys', 'PSN-1111-2222-3333', 'Filipino', 'Female', 1);

INSERT INTO Customers (FirstName, LastName, Email, Phone, IDType, IDNumber, Nationality, Gender, CreatedByID)
VALUES ('Ramon', 'Torres', 'ramon.torres@email.com', '09241234567', 'DriversLicense', 'N01-98-765432', 'Filipino', 'Male', 2);

-- ============================================================
-- SCHEDULE ASSIGNMENTS
-- ============================================================
INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (1, 1, 'A01', 'Economy', 250.00, 'confirmed', 2);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (1, 2, 'A02', 'Business', 450.00, 'confirmed', 2);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (1, 3, 'A03', 'Economy', 250.00, 'confirmed', 2);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (2, 4, 'B01', 'Economy', 300.00, 'confirmed', 1);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (2, 5, 'B02', 'Economy', 300.00, 'confirmed', 1);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (3, 6, 'C01', 'Business', 450.00, 'confirmed', 2);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (4, 7, 'D01', 'Economy', 300.00, 'confirmed', 1);

INSERT INTO ScheduleCustomers (ScheduleID, CustomerID, SeatNumber, TicketClass, FareAmount, Status, AssignedByID)
VALUES (4, 8, 'D02', 'Economy', 300.00, 'confirmed', 2);