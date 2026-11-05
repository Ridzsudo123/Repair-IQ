CREATE DATABASE RepairIQ;
GO
USE RepairIQ;
GO

CREATE TABLE Users (
  UserID INT IDENTITY(1,1) PRIMARY KEY,
  FullName NVARCHAR(100) NOT NULL,
  Email NVARCHAR(255) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  Role NVARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (Role IN ('customer','staff','admin')),
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Devices (
  DeviceID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  DeviceType NVARCHAR(50) NOT NULL,
  Brand NVARCHAR(80) NOT NULL,
  Model NVARCHAR(100) NOT NULL,
  SerialNumber NVARCHAR(100) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Devices_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE DeviceIssues (
  IssueID INT IDENTITY(1,1) PRIMARY KEY,
  DeviceID INT NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Symptoms NVARCHAR(MAX) NULL,
  Severity NVARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (Severity IN ('low','medium','high','critical')),
  Status NVARCHAR(20) NOT NULL DEFAULT 'reported'
    CHECK (Status IN ('reported','diagnosing','quoted','repairing','completed','closed')),
  ReportedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Issues_Devices FOREIGN KEY (DeviceID) REFERENCES Devices(DeviceID)
);

CREATE TABLE ServiceProviders (
  ProviderID INT IDENTITY(1,1) PRIMARY KEY,
  ProviderName NVARCHAR(150) NOT NULL,
  ContactEmail NVARCHAR(255) NULL,
  Phone NVARCHAR(30) NULL,
  Address NVARCHAR(300) NULL,
  IsActive BIT NOT NULL DEFAULT 1
);

CREATE TABLE RepairEstimates (
  EstimateID INT IDENTITY(1,1) PRIMARY KEY,
  IssueID INT NOT NULL,
  ProviderID INT NOT NULL,
  EstimatedCost DECIMAL(10,2) NOT NULL CHECK (EstimatedCost >= 0),
  Notes NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Estimates_Issues FOREIGN KEY (IssueID) REFERENCES DeviceIssues(IssueID),
  CONSTRAINT FK_Estimates_Providers FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);

CREATE TABLE RepairHistory (
  RepairID INT IDENTITY(1,1) PRIMARY KEY,
  DeviceID INT NOT NULL,
  IssueID INT NULL,
  ProviderID INT NULL,
  RepairDate DATE NOT NULL,
  AmountPaid DECIMAL(10,2) NOT NULL CHECK (AmountPaid >= 0),
  WorkDescription NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_History_Devices FOREIGN KEY (DeviceID) REFERENCES Devices(DeviceID),
  CONSTRAINT FK_History_Issues FOREIGN KEY (IssueID) REFERENCES DeviceIssues(IssueID),
  CONSTRAINT FK_History_Providers FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID)
);

CREATE INDEX IX_Devices_UserID ON Devices(UserID);
CREATE INDEX IX_Issues_DeviceID ON DeviceIssues(DeviceID);
CREATE INDEX IX_Estimates_IssueID ON RepairEstimates(IssueID);
CREATE INDEX IX_History_DeviceID ON RepairHistory(DeviceID);
GO

-- Add provider records for testing (replace with real/demo details).
INSERT INTO ServiceProviders (ProviderName, ContactEmail, Phone, Address)
VALUES
('FixPoint Service Centre', 'fixpoint@example.com', '0000000000', 'Demo address'),
('TechCare Repairs', 'techcare@example.com', '0000000001', 'Demo address');
GO
