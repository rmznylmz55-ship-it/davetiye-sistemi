' Davetiye Sistemi - Arka planda sunucu + tarayici
Option Explicit
Dim sh, fso, proje, port, url
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
' Betigin bulundugu klasoru proje klasoru olarak kullan (yol sabit degil)
proje = fso.GetParentFolderName(WScript.ScriptFullName)

port = "3000"
url = "http://localhost:" & port

' 1) Sunucu zaten calisiyor mu?
Dim isUp, http
isUp = False
Set http = CreateObject("MSXML2.XMLHTTP")
On Error Resume Next
http.open "GET", url, False
http.send
If Err.Number = 0 And http.status > 0 Then isUp = True
On Error GoTo 0

' 2) Calismiyorsa arka planda (gizli pencerede) baslat
If Not isUp Then
  sh.CurrentDirectory = proje
  sh.Run "cmd /c node server.js " & port, 0, False
End If

' 3) Tarayiciyi ac (kisa bir bekleme, sunucu hazir olsun)
WScript.Sleep 800
sh.Run url, 1, False