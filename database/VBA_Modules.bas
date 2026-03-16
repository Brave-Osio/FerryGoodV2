Attribute VB_Name = "FerryGoodVBA"
' ============================================================
' FERRY GOOD — VBA Automation Module
' Late binding version — no DAO reference required
' Works on both 32-bit and 64-bit Access installations
' ============================================================
' HOW TO IMPORT:
'   1. Press Alt + F11 to open VBA Editor
'   2. Go to File > Import File
'   3. Select this .bas file
'   4. Press F5 to verify it compiles — no errors expected
' ============================================================
Option Compare Database
Option Explicit


' ============================================================
' MODULE 1: WRITE AUDIT LOG
' Call this after any INSERT, UPDATE, DELETE action
' ============================================================
Public Sub WriteAuditLog(ByVal nUserID As Long, _
                          ByVal sUsername As String, _
                          ByVal sAction As String, _
                          ByVal sTableName As String, _
                          ByVal nRecordID As Long, _
                          ByVal sOldValues As String, _
                          ByVal sNewValues As String, _
                          ByVal sIPAddress As String)

    Dim db As Object
    Dim rs As Object

    On Error GoTo AuditError

    Set db = CurrentDb()
    Set rs = db.OpenRecordset("AuditLog", 0)

    rs.AddNew
    If nUserID > 0 Then rs!UserID = nUserID
    rs!Username  = sUsername
    rs!Action    = sAction
    rs!TableName = sTableName
    If nRecordID > 0 Then rs!RecordID = nRecordID
    rs!OldValues = sOldValues
    rs!NewValues = sNewValues
    rs!IPAddress = sIPAddress
    rs!ActionAt  = Now()
    rs.Update

    rs.Close
    Set rs = Nothing
    Set db = Nothing
    Exit Sub

AuditError:
    ' Audit failures must not block the main operation
    On Error Resume Next
    If Not rs Is Nothing Then rs.Close
    Set rs = Nothing
    Set db = Nothing
End Sub


' ============================================================
' MODULE 2: AUTO BACKUP ON CLOSE
' Attach to: File > Options > Current Database > AutoExec macro
' or call manually from the Immediate Window: AutoBackupOnClose
' ============================================================
Public Sub AutoBackupOnClose()

    Dim sDbPath     As String
    Dim sBackupPath As String
    Dim sBackupDir  As String
    Dim sTimestamp  As String
    Dim fso         As Object

    On Error GoTo BackupError

    sDbPath    = CurrentDb().Name
    sTimestamp = Format(Now(), "YYYYMMDD_HHMMSS")
    sBackupDir = Left(sDbPath, InStrRev(sDbPath, "\")) & "Backups\"
    sBackupPath = sBackupDir & "FerryGood_Backup_" & sTimestamp & ".accdb"

    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(sBackupDir) Then
        fso.CreateFolder sBackupDir
    End If

    fso.CopyFile sDbPath, sBackupPath

    Call WriteAuditLog(0, "SYSTEM", "BACKUP", "Database", 0, _
                        "", "Backup saved: " & sBackupPath, "localhost")

    Call CleanOldBackups(sBackupDir, 30)

    MsgBox "Backup saved:" & vbCrLf & sBackupPath, vbInformation, "Ferry Good Backup"

    Set fso = Nothing
    Exit Sub

BackupError:
    MsgBox "Backup failed: " & Err.Description, vbExclamation, "Backup Error"
    Set fso = Nothing
End Sub


' ============================================================
' MODULE 3: CLEAN OLD BACKUPS
' Deletes backup files older than nDays days
' Called automatically by AutoBackupOnClose
' ============================================================
Public Sub CleanOldBackups(ByVal sFolder As String, ByVal nDays As Integer)

    Dim fso       As Object
    Dim oFolder   As Object
    Dim oFile     As Object
    Dim cutoff    As Date

    On Error GoTo CleanError

    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(sFolder) Then
        Set fso = Nothing
        Exit Sub
    End If

    Set oFolder = fso.GetFolder(sFolder)
    cutoff = DateAdd("d", -nDays, Now())

    For Each oFile In oFolder.Files
        If InStr(oFile.Name, "FerryGood_Backup_") > 0 Then
            If oFile.DateCreated < cutoff Then
                oFile.Delete True
            End If
        End If
    Next oFile

    Set oFolder = Nothing
    Set fso = Nothing
    Exit Sub

CleanError:
    On Error Resume Next
    Set oFolder = Nothing
    Set fso = Nothing
End Sub


' ============================================================
' MODULE 4: VALIDATE CAPACITY
' Returns True if the ferry still has available seats
' Call before assigning a customer to a schedule
' Usage: If ValidateCapacity(1) Then ... assign ... End If
' ============================================================
Public Function ValidateCapacity(ByVal nScheduleID As Long) As Boolean

    Dim db        As Object
    Dim rs        As Object
    Dim nCapacity As Integer
    Dim nBooked   As Integer
    Dim sSQL      As String

    On Error GoTo CapacityError

    Set db = CurrentDb()

    ' Get ferry capacity for this schedule
    sSQL = "SELECT f.Capacity " & _
           "FROM Schedules AS s " & _
           "INNER JOIN Ferries AS f ON s.FerryID = f.FerryID " & _
           "WHERE s.ScheduleID = " & nScheduleID

    Set rs = db.OpenRecordset(sSQL, 1)

    If rs.EOF Then
        ValidateCapacity = False
        GoTo CleanUp
    End If

    nCapacity = rs!Capacity
    rs.Close

    ' Count active bookings for this schedule
    sSQL = "SELECT COUNT(AssignmentID) AS BookedCount " & _
           "FROM ScheduleCustomers " & _
           "WHERE ScheduleID = " & nScheduleID & _
           " AND Status <> ""cancelled"""

    Set rs = db.OpenRecordset(sSQL, 1)
    nBooked = rs!BookedCount
    rs.Close

    ValidateCapacity = (nBooked < nCapacity)

CleanUp:
    On Error Resume Next
    If Not rs Is Nothing Then rs.Close
    Set rs = Nothing
    Set db = Nothing
    Exit Function

CapacityError:
    ValidateCapacity = False
    GoTo CleanUp
End Function


' ============================================================
' MODULE 5: CASCADE SCHEDULE STATUS UPDATE
' When a schedule is cancelled, this cancels all its bookings
' Usage: CascadeScheduleStatusUpdate 1, "cancelled", 1, "admin"
' ============================================================
Public Sub CascadeScheduleStatusUpdate(ByVal nScheduleID As Long, _
                                        ByVal sNewStatus As String, _
                                        ByVal nUserID As Long, _
                                        ByVal sUsername As String)

    Dim db        As Object
    Dim nAffected As Long
    Dim sSQL      As String

    On Error GoTo CascadeError

    Set db = CurrentDb()

    ' If cancelling the schedule, cancel all active passenger bookings
    If sNewStatus = "cancelled" Then
        sSQL = "UPDATE ScheduleCustomers " & _
               "SET Status = ""cancelled"", " & _
               "RemovedAt = Now(), " & _
               "RemovedByID = " & nUserID & ", " & _
               "RemovalReason = ""Schedule cancelled"" " & _
               "WHERE ScheduleID = " & nScheduleID & _
               " AND Status NOT IN (""cancelled"", ""boarded"")"

        db.Execute sSQL, 128
        nAffected = db.RecordsAffected

        Call WriteAuditLog(nUserID, sUsername, "CASCADE_CANCEL", _
                            "ScheduleCustomers", nScheduleID, _
                            "Status=active", _
                            "Status=cancelled, Records=" & nAffected, "vba")
    End If

    ' Update the schedule status itself
    sSQL = "UPDATE Schedules " & _
           "SET Status = """ & sNewStatus & """, " & _
           "UpdatedAt = Now() " & _
           "WHERE ScheduleID = " & nScheduleID

    db.Execute sSQL, 128

    Call WriteAuditLog(nUserID, sUsername, "UPDATE", "Schedules", nScheduleID, _
                        "Status=previous", "Status=" & sNewStatus, "vba")

    MsgBox "Schedule #" & nScheduleID & " updated to: " & sNewStatus, _
           vbInformation, "Status Updated"

    Set db = Nothing
    Exit Sub

CascadeError:
    MsgBox "Cascade update failed: " & Err.Description, vbExclamation, "Error"
    Set db = Nothing
End Sub


' ============================================================
' MODULE 6: CLEAN ORPHAN RECORDS
' Removes ScheduleCustomers rows with no matching parent record
' Run this manually from the Immediate Window: CleanOrphanRecords
' ============================================================
Public Sub CleanOrphanRecords()

    Dim db        As Object
    Dim nOrphans  As Long

    On Error GoTo OrphanError

    Set db = CurrentDb()

    ' Remove bookings where the customer was hard-deleted
    db.Execute _
        "DELETE FROM ScheduleCustomers " & _
        "WHERE CustomerID NOT IN (SELECT CustomerID FROM Customers)", 128
    nOrphans = db.RecordsAffected

    ' Remove bookings where the schedule was hard-deleted
    db.Execute _
        "DELETE FROM ScheduleCustomers " & _
        "WHERE ScheduleID NOT IN (SELECT ScheduleID FROM Schedules)", 128
    nOrphans = nOrphans + db.RecordsAffected

    Call WriteAuditLog(0, "SYSTEM", "CLEANUP", "ScheduleCustomers", 0, _
                        "", "Removed " & nOrphans & " orphan records", "vba")

    MsgBox "Cleanup complete. " & nOrphans & " orphan records removed.", _
           vbInformation, "Orphan Cleanup"

    Set db = Nothing
    Exit Sub

OrphanError:
    MsgBox "Cleanup error: " & Err.Description, vbExclamation, "Error"
    Set db = Nothing
End Sub


' ============================================================
' MODULE 7: GENERATE PASSENGER MANIFEST
' Writes a plain-text manifest file for a given schedule
' Usage: GenerateManifest 1
' ============================================================
Public Sub GenerateManifest(ByVal nScheduleID As Long)

    Dim db       As Object
    Dim rs       As Object
    Dim fso      As Object
    Dim sSQL     As String
    Dim sOutput  As String
    Dim sDir     As String
    Dim sPath    As String
    Dim nFile    As Integer
    Dim nRow     As Integer

    On Error GoTo ManifestError

    Set db  = CurrentDb()
    Set fso = CreateObject("Scripting.FileSystemObject")

    ' Get schedule info
    sSQL = "SELECT f.FerryName, po.PortName AS Origin, pd.PortName AS Dest, " & _
           "s.DepartureTime, s.ArrivalTime, s.Status " & _
           "FROM ((((Schedules AS s " & _
           "INNER JOIN Ferries AS f ON s.FerryID = f.FerryID) " & _
           "INNER JOIN Routes AS r ON s.RouteID = r.RouteID) " & _
           "INNER JOIN Ports AS po ON r.OriginPortID = po.PortID) " & _
           "INNER JOIN Ports AS pd ON r.DestPortID = pd.PortID) " & _
           "WHERE s.ScheduleID = " & nScheduleID

    Set rs = db.OpenRecordset(sSQL, 1)

    If rs.EOF Then
        MsgBox "Schedule #" & nScheduleID & " not found.", vbExclamation
        GoTo CleanUp
    End If

    sOutput = String(44, "=") & vbCrLf
    sOutput = sOutput & "  FERRY GOOD - PASSENGER MANIFEST" & vbCrLf
    sOutput = sOutput & String(44, "=") & vbCrLf
    sOutput = sOutput & "Ferry    : " & rs!FerryName & vbCrLf
    sOutput = sOutput & "Route    : " & rs!Origin & " to " & rs!Dest & vbCrLf
    sOutput = sOutput & "Departs  : " & Format(rs!DepartureTime, "YYYY-MM-DD HH:MM") & vbCrLf
    sOutput = sOutput & "Arrives  : " & Format(rs!ArrivalTime, "YYYY-MM-DD HH:MM") & vbCrLf
    sOutput = sOutput & "Status   : " & rs!Status & vbCrLf
    sOutput = sOutput & "Generated: " & Format(Now(), "YYYY-MM-DD HH:MM:SS") & vbCrLf
    sOutput = sOutput & String(44, "-") & vbCrLf
    sOutput = sOutput & " No  " & PadRight("FULL NAME", 28) & PadRight("SEAT", 7) & "CLASS" & vbCrLf
    sOutput = sOutput & String(44, "-") & vbCrLf
    rs.Close

    ' Get passenger list
    sSQL = "SELECT c.FirstName & "" "" & c.LastName AS FullName, " & _
           "sc.SeatNumber, sc.TicketClass, sc.Status " & _
           "FROM ScheduleCustomers AS sc " & _
           "INNER JOIN Customers AS c ON sc.CustomerID = c.CustomerID " & _
           "WHERE sc.ScheduleID = " & nScheduleID & _
           " AND sc.Status <> ""cancelled"" " & _
           "ORDER BY c.LastName, c.FirstName"

    Set rs = db.OpenRecordset(sSQL, 1)

    nRow = 1
    Do While Not rs.EOF
        sOutput = sOutput & _
                  PadRight(CStr(nRow), 5) & _
                  PadRight(Nz(rs!FullName, ""), 28) & _
                  PadRight(Nz(rs!SeatNumber, "N/A"), 7) & _
                  Nz(rs!TicketClass, "") & vbCrLf
        nRow = nRow + 1
        rs.MoveNext
    Loop

    sOutput = sOutput & String(44, "=") & vbCrLf
    sOutput = sOutput & "Total Passengers: " & (nRow - 1) & vbCrLf
    rs.Close

    ' Save to file
    sDir = Left(CurrentDb().Name, InStrRev(CurrentDb().Name, "\")) & "Manifests\"
    If Not fso.FolderExists(sDir) Then fso.CreateFolder sDir

    sPath = sDir & "Manifest_" & nScheduleID & "_" & Format(Now(), "YYYYMMDD") & ".txt"

    nFile = FreeFile()
    Open sPath For Output As #nFile
    Print #nFile, sOutput
    Close #nFile

    MsgBox "Manifest saved:" & vbCrLf & sPath, vbInformation, "Manifest Generated"

CleanUp:
    On Error Resume Next
    If Not rs Is Nothing Then rs.Close
    Set rs = Nothing
    Set db = Nothing
    Set fso = Nothing
    Exit Sub

ManifestError:
    MsgBox "Manifest error: " & Err.Description, vbExclamation, "Error"
    GoTo CleanUp
End Sub


' ============================================================
' MODULE 8: ENABLE COMPACT ON CLOSE
' Access cannot compact itself while it is open.
' This sub enables the built-in "Compact on Close" setting
' so Access automatically compacts the file every time it closes.
' Run this once: EnableCompactOnClose
' ============================================================
Public Sub EnableCompactOnClose()

    On Error GoTo CompactError

    ' Enable the built-in Compact on Close option
    Application.SetOption "Auto Compact", True

    Call WriteAuditLog(0, "SYSTEM", "COMPACT_ENABLED", "Database", 0, _
                        "", "Compact on Close enabled", "vba")

    MsgBox "Done! Compact on Close is now enabled." & vbCrLf & vbCrLf & _
           "The database will automatically compact" & vbCrLf & _
           "every time you close it.", _
           vbInformation, "Compact on Close"

    Exit Sub

CompactError:
    MsgBox "Error: " & Err.Description, vbExclamation, "Error"
End Sub


' ============================================================
' MODULE 9: MANUAL COMPACT REMINDER
' Access cannot compact itself while open.
' To compact manually: close the DB, then go to
' File > Info > Compact & Repair Database (from the start screen)
' OR enable Compact on Close via EnableCompactOnClose above.
' ============================================================
Public Sub CompactReminder()

    MsgBox "Access cannot compact the database while it is open." & vbCrLf & vbCrLf & _
           "To compact manually:" & vbCrLf & _
           "1. Close this database" & vbCrLf & _
           "2. On the Access start screen:" & vbCrLf & _
           "   File > Info > Compact & Repair Database" & vbCrLf & vbCrLf & _
           "To compact automatically on every close:" & vbCrLf & _
           "   Run: EnableCompactOnClose", _
           vbInformation, "Compact & Repair"
End Sub


' ============================================================
' HELPER: PadRight
' Pads or truncates a string to exactly nWidth characters
' ============================================================
Private Function PadRight(ByVal sText As String, ByVal nWidth As Integer) As String
    If Len(sText) >= nWidth Then
        PadRight = Left(sText, nWidth)
    Else
        PadRight = sText & Space(nWidth - Len(sText))
    End If
End Function
