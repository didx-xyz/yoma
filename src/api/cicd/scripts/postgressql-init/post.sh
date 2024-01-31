#!/bin/bash

set -e

# Test data initialization script(s) as input parameter(s)
sql_files=($@)

echo "Test login to PostgreSQL" >> /dev/stdout
# You can use 'psql' to execute SQL commands in PostgreSQL
psql -c "SELECT version();" >> /dev/stdout

# Check if the initialization_flag table exists and the flag value is 'executed'
result=$(psql -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'script_execution' AND table_schema = 'public');")
table_exists=$(echo "$result" | tr -d ' ')

if [ "$table_exists" != "f" ]; then
  for file in "${sql_files[@]}"; do
    echo "########## running $file ##########" >> /dev/stdout
    # Execute the SQL file using 'psql'
    psql -a -f "$file" >> /dev/stdout
  done
  # Create the initialization_flag table if it does not exist
  psql -c "CREATE TABLE IF NOT EXISTS script_execution (script_name VARCHAR PRIMARY KEY, executed BOOLEAN NOT NULL DEFAULT FALSE);" >> /dev/stdout
else
  echo "########## DB already initialized ##########" >> /dev/stdout
  exit 0
fi

# Exit to signal that the initialization is complete
echo "Initialization complete." >> /dev/stdout
exit 0
