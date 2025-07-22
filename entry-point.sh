#!/bin/bash
/opt/mssql/bin/sqlservr &

# Wait for SQL Server to start
until /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -Q "SELECT 1" -N -C > /dev/null 2>&1
do
  echo "Waiting for SQL Server to be ready..."
  sleep 2
done

echo "SQL Server is up."

# Enable SQL Server Agent
echo "Enabling SQL Server Agent..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE;" -N -C
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -Q "EXEC sp_configure 'Agent XPs', 1; RECONFIGURE;" -N -C

# Run your init.sql
echo "Running init.sql..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -i /init.sql -N -C

# Keep container alive
tail -f /dev/null

