# Post-Restart Service Checklist

```powershell
Get-Service -Name W3SVC
Get-Service -Name MySQL80
pm2 status secretapp-backend
curl.exe http://127.0.0.1:3001/api/test
curl.exe -k https://secretapp.enzolopez.net/api/test
```
