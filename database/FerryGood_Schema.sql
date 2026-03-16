-- ============================================================
-- FERRY GOOD — Microsoft Access (JET/ACE SQL) Schema
-- ============================================================
-- HOW TO RUN:
--   1. Open Access > Create > Query Design
--   2. Close the "Show Table" dialog
--   3. Click Home > View > SQL View
--   4. Paste ONE statement at a time and click Run (!)
--   5. Follow the numbered order below exactly
-- ============================================================
-- ACCESS SQL RULES APPLIED HERE:
--   - COUNTER used instead of AUTOINCREMENT
--   - No inline CONSTRAINT inside CREATE TABLE
--   - No DEFAULT values inside CREATE TABLE
--   - No CHECK constraints (not supported by JET/ACE)
--   - All PRIMARY KEY, UNIQUE, FOREIGN KEY added via ALTER TABLE
--   - String literals use double quotes "value" not single quotes
--   - Comments use -- on their own line only (not inline)
-- ============================================================


-- ============================================================
-- STEP 1: CREATE TABLE Users
-- ============================================================

CREATE TABLE Users (
    UserID       COUNTER,
    Username     TEXT(50)  NOT NULL,
    PasswordHash TEXT(255) NOT NULL,
    FullName     TEXT(100) NOT NULL,
    Email        TEXT(150),
    Role         TEXT(20)  NOT NULL,
    IsActive     YESNO,
    CreatedAt    DATETIME,
    LastLogin    DATETIME
);


-- ============================================================
-- STEP 2: PRIMARY KEY — Users
-- ============================================================

ALTER TABLE Users
ADD CONSTRAINT PK_Users PRIMARY KEY (UserID);


-- ============================================================
-- STEP 3: UNIQUE — Users.Username
-- ============================================================

ALTER TABLE Users
ADD CONSTRAINT UQ_Username UNIQUE (Username);


-- ============================================================
-- STEP 4: CREATE TABLE Ferries
-- ============================================================

CREATE TABLE Ferries (
    FerryID     COUNTER,
    FerryName   TEXT(100) NOT NULL,
    FerryCode   TEXT(10)  NOT NULL,
    Capacity    INTEGER   NOT NULL,
    FerryType   TEXT(50),
    Description MEMO,
    IsActive    YESNO,
    CreatedAt   DATETIME
);


-- ============================================================
-- STEP 5: PRIMARY KEY — Ferries
-- ============================================================

ALTER TABLE Ferries
ADD CONSTRAINT PK_Ferries PRIMARY KEY (FerryID);


-- ============================================================
-- STEP 6: UNIQUE — Ferries.FerryCode
-- ============================================================

ALTER TABLE Ferries
ADD CONSTRAINT UQ_FerryCode UNIQUE (FerryCode);


-- ============================================================
-- STEP 7: CREATE TABLE Ports
-- ============================================================

CREATE TABLE Ports (
    PortID    COUNTER,
    PortName  TEXT(100) NOT NULL,
    PortCode  TEXT(5)   NOT NULL,
    City      TEXT(100),
    Province  TEXT(100),
    IsActive  YESNO
);


-- ============================================================
-- STEP 8: PRIMARY KEY — Ports
-- ============================================================

ALTER TABLE Ports
ADD CONSTRAINT PK_Ports PRIMARY KEY (PortID);


-- ============================================================
-- STEP 9: UNIQUE — Ports.PortCode
-- ============================================================

ALTER TABLE Ports
ADD CONSTRAINT UQ_PortCode UNIQUE (PortCode);


-- ============================================================
-- STEP 10: CREATE TABLE Routes
-- ============================================================

CREATE TABLE Routes (
    RouteID        COUNTER,
    OriginPortID   INTEGER NOT NULL,
    DestPortID     INTEGER NOT NULL,
    RouteCode      TEXT(20) NOT NULL,
    DistanceKM     DOUBLE,
    EstDurationMin INTEGER,
    IsActive       YESNO
);


-- ============================================================
-- STEP 11: PRIMARY KEY — Routes
-- ============================================================

ALTER TABLE Routes
ADD CONSTRAINT PK_Routes PRIMARY KEY (RouteID);


-- ============================================================
-- STEP 12: UNIQUE — Routes.RouteCode
-- ============================================================

ALTER TABLE Routes
ADD CONSTRAINT UQ_RouteCode UNIQUE (RouteCode);


-- ============================================================
-- STEP 13: FOREIGN KEY — Routes.OriginPortID -> Ports
-- ============================================================

ALTER TABLE Routes
ADD CONSTRAINT FK_Routes_Origin
FOREIGN KEY (OriginPortID) REFERENCES Ports (PortID);


-- ============================================================
-- STEP 14: FOREIGN KEY — Routes.DestPortID -> Ports
-- ============================================================

ALTER TABLE Routes
ADD CONSTRAINT FK_Routes_Dest
FOREIGN KEY (DestPortID) REFERENCES Ports (PortID);


-- ============================================================
-- STEP 15: CREATE TABLE Schedules
-- ============================================================

CREATE TABLE Schedules (
    ScheduleID    COUNTER,
    FerryID       INTEGER  NOT NULL,
    RouteID       INTEGER  NOT NULL,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime   DATETIME NOT NULL,
    Status        TEXT(20),
    RemarkNotes   MEMO,
    CreatedByID   INTEGER,
    CreatedAt     DATETIME,
    UpdatedAt     DATETIME
);


-- ============================================================
-- STEP 16: PRIMARY KEY — Schedules
-- ============================================================

ALTER TABLE Schedules
ADD CONSTRAINT PK_Schedules PRIMARY KEY (ScheduleID);


-- ============================================================
-- STEP 17: FOREIGN KEY — Schedules.FerryID -> Ferries
-- ============================================================

ALTER TABLE Schedules
ADD CONSTRAINT FK_Schedules_Ferry
FOREIGN KEY (FerryID) REFERENCES Ferries (FerryID);


-- ============================================================
-- STEP 18: FOREIGN KEY — Schedules.RouteID -> Routes
-- ============================================================

ALTER TABLE Schedules
ADD CONSTRAINT FK_Schedules_Route
FOREIGN KEY (RouteID) REFERENCES Routes (RouteID);


-- ============================================================
-- STEP 19: FOREIGN KEY — Schedules.CreatedByID -> Users
-- ============================================================

ALTER TABLE Schedules
ADD CONSTRAINT FK_Schedules_User
FOREIGN KEY (CreatedByID) REFERENCES Users (UserID);


-- ============================================================
-- STEP 20: CREATE TABLE Customers
-- ============================================================

CREATE TABLE Customers (
    CustomerID  COUNTER,
    FirstName   TEXT(80)  NOT NULL,
    LastName    TEXT(80)  NOT NULL,
    Email       TEXT(150),
    Phone       TEXT(20),
    IDType      TEXT(30),
    IDNumber    TEXT(50),
    Nationality TEXT(80),
    BirthDate   DATETIME,
    Gender      TEXT(10),
    Address     MEMO,
    IsActive    YESNO,
    CreatedByID INTEGER,
    CreatedAt   DATETIME,
    UpdatedAt   DATETIME
);


-- ============================================================
-- STEP 21: PRIMARY KEY — Customers
-- ============================================================

ALTER TABLE Customers
ADD CONSTRAINT PK_Customers PRIMARY KEY (CustomerID);


-- ============================================================
-- STEP 22: FOREIGN KEY — Customers.CreatedByID -> Users
-- ============================================================

ALTER TABLE Customers
ADD CONSTRAINT FK_Customers_User
FOREIGN KEY (CreatedByID) REFERENCES Users (UserID);


-- ============================================================
-- STEP 23: CREATE TABLE ScheduleCustomers
-- ============================================================

CREATE TABLE ScheduleCustomers (
    AssignmentID  COUNTER,
    ScheduleID    INTEGER  NOT NULL,
    CustomerID    INTEGER  NOT NULL,
    SeatNumber    TEXT(10),
    TicketClass   TEXT(20),
    FareAmount    CURRENCY,
    Status        TEXT(20),
    AssignedAt    DATETIME,
    AssignedByID  INTEGER,
    RemovedAt     DATETIME,
    RemovedByID   INTEGER,
    RemovalReason MEMO
);


-- ============================================================
-- STEP 24: PRIMARY KEY — ScheduleCustomers
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT PK_ScheduleCustomers PRIMARY KEY (AssignmentID);


-- ============================================================
-- STEP 25: UNIQUE — ScheduleCustomers (ScheduleID, CustomerID)
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT UQ_SC_Pair UNIQUE (ScheduleID, CustomerID);


-- ============================================================
-- STEP 26: FOREIGN KEY — ScheduleCustomers.ScheduleID -> Schedules
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT FK_SC_Schedule
FOREIGN KEY (ScheduleID) REFERENCES Schedules (ScheduleID);


-- ============================================================
-- STEP 27: FOREIGN KEY — ScheduleCustomers.CustomerID -> Customers
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT FK_SC_Customer
FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);


-- ============================================================
-- STEP 28: FOREIGN KEY — ScheduleCustomers.AssignedByID -> Users
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT FK_SC_AssignedBy
FOREIGN KEY (AssignedByID) REFERENCES Users (UserID);


-- ============================================================
-- STEP 29: FOREIGN KEY — ScheduleCustomers.RemovedByID -> Users
-- ============================================================

ALTER TABLE ScheduleCustomers
ADD CONSTRAINT FK_SC_RemovedBy
FOREIGN KEY (RemovedByID) REFERENCES Users (UserID);


-- ============================================================
-- STEP 30: CREATE TABLE AuditLog
-- ============================================================

CREATE TABLE AuditLog (
    LogID     COUNTER,
    UserID    INTEGER,
    Username  TEXT(50),
    Action    TEXT(50) NOT NULL,
    TableName TEXT(50),
    RecordID  INTEGER,
    OldValues MEMO,
    NewValues MEMO,
    IPAddress TEXT(45),
    ActionAt  DATETIME
);


-- ============================================================
-- STEP 31: PRIMARY KEY — AuditLog
-- ============================================================

ALTER TABLE AuditLog
ADD CONSTRAINT PK_AuditLog PRIMARY KEY (LogID);


-- ============================================================
-- STEP 32: FOREIGN KEY — AuditLog.UserID -> Users
-- NOTE: nullable FK — UserID can be NULL for system actions
-- ============================================================

ALTER TABLE AuditLog
ADD CONSTRAINT FK_AuditLog_User
FOREIGN KEY (UserID) REFERENCES Users (UserID);


-- ============================================================
-- STEP 33: INDEX — Schedules.FerryID
-- ============================================================

CREATE INDEX IDX_Sched_Ferry
ON Schedules (FerryID);


-- ============================================================
-- STEP 34: INDEX — Schedules.RouteID
-- ============================================================

CREATE INDEX IDX_Sched_Route
ON Schedules (RouteID);


-- ============================================================
-- STEP 35: INDEX — Schedules.DepartureTime
-- ============================================================

CREATE INDEX IDX_Sched_Departure
ON Schedules (DepartureTime);


-- ============================================================
-- STEP 36: INDEX — Schedules.Status
-- ============================================================

CREATE INDEX IDX_Sched_Status
ON Schedules (Status);


-- ============================================================
-- STEP 37: INDEX — ScheduleCustomers.ScheduleID
-- ============================================================

CREATE INDEX IDX_SC_Schedule
ON ScheduleCustomers (ScheduleID);


-- ============================================================
-- STEP 38: INDEX — ScheduleCustomers.CustomerID
-- ============================================================

CREATE INDEX IDX_SC_Customer
ON ScheduleCustomers (CustomerID);


-- ============================================================
-- STEP 39: INDEX — ScheduleCustomers.Status
-- ============================================================

CREATE INDEX IDX_SC_Status
ON ScheduleCustomers (Status);


-- ============================================================
-- STEP 40: INDEX — Customers.LastName
-- ============================================================

CREATE INDEX IDX_Cust_LastName
ON Customers (LastName);


-- ============================================================
-- STEP 41: INDEX — Customers.Email
-- ============================================================

CREATE INDEX IDX_Cust_Email
ON Customers (Email);


-- ============================================================
-- STEP 42: INDEX — AuditLog.UserID
-- ============================================================

CREATE INDEX IDX_Log_UserID
ON AuditLog (UserID);


-- ============================================================
-- STEP 43: INDEX — AuditLog.Action
-- ============================================================

CREATE INDEX IDX_Log_Action
ON AuditLog (Action);


-- ============================================================
-- STEP 44: INDEX — AuditLog.ActionAt
-- ============================================================

CREATE INDEX IDX_Log_ActionAt
ON AuditLog (ActionAt);


-- ============================================================
-- STEP 45: INDEX — Users.Username
-- ============================================================

CREATE INDEX IDX_Users_Username
ON Users (Username);


-- ============================================================
-- STEP 46: INDEX — Users.Role
-- ============================================================

CREATE INDEX IDX_Users_Role
ON Users (Role);


-- ============================================================
-- ALL DONE — 46 statements
-- Check the Navigation Pane: you should see 8 tables
--   Users, Ferries, Ports, Routes, Schedules,
--   Customers, ScheduleCustomers, AuditLog
-- ============================================================


-- ============================================================
-- SAVED QUERIES
-- Save each one individually via Create > Query Design > SQL View
-- Give each query the name shown in the comment above it
-- ============================================================


-- Save as: QRY_ActiveSchedules

SELECT
    s.ScheduleID,
    f.FerryName,
    f.FerryCode,
    f.Capacity,
    f.FerryType,
    po.PortName AS OriginPort,
    po.PortCode AS OriginCode,
    pd.PortName AS DestPort,
    pd.PortCode AS DestCode,
    r.RouteCode,
    r.DistanceKM,
    r.EstDurationMin,
    s.DepartureTime,
    s.ArrivalTime,
    s.Status,
    s.RemarkNotes,
    (SELECT COUNT(sc.AssignmentID)
     FROM ScheduleCustomers AS sc
     WHERE sc.ScheduleID = s.ScheduleID
     AND sc.Status <> "cancelled") AS AssignedCount
FROM ((((Schedules AS s
    INNER JOIN Ferries AS f ON s.FerryID = f.FerryID)
    INNER JOIN Routes AS r ON s.RouteID = r.RouteID)
    INNER JOIN Ports AS po ON r.OriginPortID = po.PortID)
    INNER JOIN Ports AS pd ON r.DestPortID = pd.PortID)
WHERE s.Status <> "cancelled"
ORDER BY s.DepartureTime;


-- Save as: QRY_CustomerHistory

SELECT
    sc.AssignmentID,
    c.CustomerID,
    c.FirstName & " " & c.LastName AS FullName,
    c.Email,
    c.Phone,
    c.IDType,
    c.IDNumber,
    s.ScheduleID,
    s.DepartureTime,
    s.ArrivalTime,
    s.Status AS ScheduleStatus,
    f.FerryName,
    f.FerryCode,
    po.PortName AS OriginPort,
    pd.PortName AS DestPort,
    r.RouteCode,
    sc.SeatNumber,
    sc.TicketClass,
    sc.FareAmount,
    sc.Status AS BookingStatus,
    sc.AssignedAt,
    u.FullName AS AssignedByName
FROM ((((((ScheduleCustomers AS sc
    INNER JOIN Customers AS c ON sc.CustomerID = c.CustomerID)
    INNER JOIN Schedules AS s ON sc.ScheduleID = s.ScheduleID)
    INNER JOIN Ferries AS f ON s.FerryID = f.FerryID)
    INNER JOIN Routes AS r ON s.RouteID = r.RouteID)
    INNER JOIN Ports AS po ON r.OriginPortID = po.PortID)
    INNER JOIN Ports AS pd ON r.DestPortID = pd.PortID)
    LEFT JOIN Users AS u ON sc.AssignedByID = u.UserID
ORDER BY sc.AssignedAt DESC;


-- Save as: QRY_OverbookingCheck

SELECT
    s.ScheduleID,
    f.FerryName,
    f.FerryCode,
    f.Capacity,
    (SELECT COUNT(sc.AssignmentID)
     FROM ScheduleCustomers AS sc
     WHERE sc.ScheduleID = s.ScheduleID
     AND sc.Status <> "cancelled") AS BookedCount
FROM Schedules AS s
INNER JOIN Ferries AS f ON s.FerryID = f.FerryID
WHERE s.Status <> "cancelled";