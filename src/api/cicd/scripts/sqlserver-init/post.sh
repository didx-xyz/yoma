#!/bin/bash

set -e

HOST=$1
USER=$2
shift 2
# For clean initialization without standard migrations

sql_files=($@)

echo "Test login to SQL Server" >>/dev/stdout
/opt/mssql-tools/bin/sqlcmd -S $HOST -U $USER -d "master" -Q "SELECT @@VERSION;" -W -s "," >>/dev/stdout

# Check if the initialization_flag table exists and the flag value is 'executed'
result=$(/opt/mssql-tools/bin/sqlcmd -S $HOST -U $USER -d "master" -Q "IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'initialization_flag_post') SELECT 1;")
table_exists=$(echo "$result" | awk 'NR==3 {print $1}')

if [ "$table_exists" != "1" ]; then
  for file in "${sql_files[@]}"; do
    echo "########## running $file ##########" >>/dev/stdout
    /opt/mssql-tools/bin/sqlcmd -S $HOST -U $USER -d "master" -i "$file" -W -s "," >>/dev/stdout
  done
  # Create the initialization_flag table if it does not exist
  /opt/mssql-tools/bin/sqlcmd -S $HOST -U $USER -d "master" -Q "IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'initialization_flag_post') BEGIN CREATE TABLE initialization_flag_post (flag VARCHAR(10) NOT NULL); END;" -W -s "," >>/dev/stdout
else
  echo "########## DB already initialized ##########" >>/dev/stdout
  exit 0
fi

# Exit to signal that the initialization is complete to support depends_on condition: service_completed_successfully
echo "Initialization complete." >>/dev/stdout
exit 0
