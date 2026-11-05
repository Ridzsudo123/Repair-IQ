# RepairIQ – ER Diagram

Paste this Mermaid code into Mermaid Live Editor or a Markdown viewer that supports Mermaid.

```mermaid
erDiagram
    USERS ||--o{ DEVICES : owns
    DEVICES ||--o{ DEVICE_ISSUES : has
    DEVICE_ISSUES ||--o{ REPAIR_ESTIMATES : receives
    SERVICE_PROVIDERS ||--o{ REPAIR_ESTIMATES : provides
    DEVICES ||--o{ REPAIR_HISTORY : has
    DEVICE_ISSUES o|--o{ REPAIR_HISTORY : relates_to
    SERVICE_PROVIDERS o|--o{ REPAIR_HISTORY : performs

    USERS {
      int UserID PK
      string FullName
      string Email UK
      string PasswordHash
      string Role
      datetime CreatedAt
    }
    DEVICES {
      int DeviceID PK
      int UserID FK
      string DeviceType
      string Brand
      string Model
      string SerialNumber
      datetime CreatedAt
    }
    DEVICE_ISSUES {
      int IssueID PK
      int DeviceID FK
      string Description
      string Symptoms
      string Severity
      string Status
      datetime ReportedAt
    }
    SERVICE_PROVIDERS {
      int ProviderID PK
      string ProviderName
      string ContactEmail
      string Phone
      string Address
      boolean IsActive
    }
    REPAIR_ESTIMATES {
      int EstimateID PK
      int IssueID FK
      int ProviderID FK
      decimal EstimatedCost
      string Notes
      datetime CreatedAt
    }
    REPAIR_HISTORY {
      int RepairID PK
      int DeviceID FK
      int IssueID FK
      int ProviderID FK
      date RepairDate
      decimal AmountPaid
      string WorkDescription
      datetime CreatedAt
    }
```

## Relationship explanation
- One user can register many devices (1:M).
- One device can have many reported issues (1:M).
- One issue can receive estimates from multiple service providers (1:M).
- One service provider can submit many estimates (1:M).
- One device can have multiple repair-history entries (1:M).
- A repair-history entry may optionally refer to an issue and a service provider.
