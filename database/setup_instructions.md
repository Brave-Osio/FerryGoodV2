# 🗄️ Ferry Good — Database Setup Instructions

## Prerequisites

- **Windows OS** (required for ACEOLEDB driver)
- **Microsoft Access 2016+** or **Microsoft 365**
- **Microsoft Access Database Engine 2016** (for headless ODBC connections)
  - Download: https://www.microsoft.com/en-us/download/details.aspx?id=54920
  - Use the **64-bit** version if your Node.js is 64-bit

---

## Step 1: Create the Access Database File

1. Open **Microsoft Access**
2. Click **Blank Database**
3. Name it `FerryGood.accdb`
4. Save it to: `C:\FerryGood\database\FerryGood.accdb`

---

## Step 2: Run the Schema SQL

1. In Access, go to **Create → Query Design**
2. Close the "Show Table" dialog
3. Switch to **SQL View** (Home → View → SQL View)
4. Paste the contents of `FerryGood_Schema.sql` — execute **one table at a time** (Access Query editor runs one CREATE TABLE per execution)
5. Click the **Run (!)** button for each table

**Order of execution (respect FK constraints):**
1. `Users`
2. `Ports`
3. `Ferries`
4. `Routes`
5. `Schedules`
6. `Customers`
7. `ScheduleCustomers`
8. `AuditLog`
9. Then run all `CREATE INDEX` statements

---

## Step 3: Insert Sample Data

Follow the same Query → SQL View process for `SampleData.sql`.

Execute each `INSERT INTO` block group separately.

---

## Step 4: Import VBA Modules

1. Press `Alt + F11` to open the **VBA Editor**
2. Go to **File → Import File**
3. Select `VBA_Modules.bas`
4. The module `FerryGoodVBA` will appear in the project tree
5. Press `F5` or run via **Tools → Macros** to test individual functions

### Attach AutoBackup to Database Close:
1. Go to **File → Options → Current Database**
2. Under **Application Options**, set **Display Form** to none
3. Create a **Macro** named `AutoExec`:
   - Action: `RunCode`
   - Function Name: `AutoBackupOnClose()`
   - This runs every time the database opens (use `Application.Quit` event for close)

---

## Step 5: Set Up ODBC Connection (for Node.js API)

### Option A — File DSN (Recommended)
1. Open **ODBC Data Source Administrator (64-bit)**: `C:\Windows\SysWOW64\odbcad32.exe`
2. Go to **File DSN** tab → **Add**
3. Select **Microsoft Access Driver (*.mdb, *.accdb)** → **Next**
4. Name: `FerryGoodDSN`
5. Click **Select** and point to `C:\FerryGood\database\FerryGood.accdb`
6. Click **OK**

### Option B — Connection String (used in api-server)
```
Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\FerryGood\database\FerryGood.accdb;Persist Security Info=False;
```

---

## Step 6: Database Security

### Set a Database Password:
1. Open Access with **Exclusive Access**: File → Open → Browse → select file → click arrow on Open button → **Open Exclusive**
2. Go to **File → Info → Encrypt with Password**
3. Set password: `FerryGood@DB2026!`
4. Update the `DB_PASSWORD` in `api-server/.env`

### User-Level Security (VBA-enforced):
- The `Users` table with `PasswordHash` (bcrypt) handles application-level auth
- Database-level password protects the .accdb file itself
- API server never exposes raw DB credentials to the frontend

---

## Step 7: Backup Configuration

Backups are stored in: `C:\FerryGood\database\Backups\`

The `AutoBackupOnClose()` VBA module:
- Runs on database close
- Creates timestamped `.accdb` copies
- Purges files older than **30 days** automatically

### Manual Backup via API:
```
POST /api/admin/backup
Authorization: Bearer <admin_jwt_token>
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "Could not find installable ISAM" | Install 64-bit Access Database Engine |
| "Operation not supported for this type of object" | Run CREATE TABLE one at a time in Access |
| OLEDB connection fails | Ensure DB is not open in Access while API runs |
| bcrypt hash mismatch | Re-hash passwords using `node scripts/hash-passwords.js` |

---

## Performance Notes

- **Indexes** are pre-defined in schema for all FK columns and frequent WHERE/ORDER BY fields
- **Compact & Repair** runs automatically via `ScheduledCompactRepair()` VBA module
- Access supports **up to ~2GB** database size and **~255 concurrent connections** (via ODBC pooling)
- For production scale (>50 concurrent users), consider migrating to **SQL Server Express** (free) using Access's **Upsizing Wizard**: Database Tools → Move Data → SQL Server