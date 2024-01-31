#!/bin/bash

set -e

# Test data initialization script(s) as input parameter(s)
sql_files=($@)

echo "Test login to PostgreSQL" >> /dev/stdout
# You can use 'psql' to execute SQL commands in PostgreSQL
psql -c "SELECT version();" >> /dev/stdout

# Create the script_execution table if it does not exist
psql -c "CREATE TABLE IF NOT EXISTS script_execution (script_name VARCHAR PRIMARY KEY, executed BOOLEAN NOT NULL DEFAULT FALSE);" >> /dev/stdout

# Process each SQL file
for file in "${sql_files[@]}"; do
    # Extract filename without path for logging
    filename=$(basename "$file")

    echo "Checking execution status for $filename" >> /dev/stdout
    # Check if this script has been executed
    result=$(psql -t -c "SELECT executed FROM script_execution WHERE script_name = '$filename';")
    script_executed=$(echo "$result" | tr -d '[:space:]')

    if [ "$script_executed" != "t" ]; then
        echo "########## running $filename ##########" >> /dev/stdout
        # Execute the SQL file using 'psql'
        psql -f "$file" >> /dev/stdout

        echo "Marking $filename as executed" >> /dev/stdout
        # Mark this script as executed in the script_execution table
        psql -c "INSERT INTO script_execution (script_name, executed) VALUES ('$filename', TRUE) ON CONFLICT (script_name) DO UPDATE SET executed = TRUE;" >> /dev/stdout
    else
        echo "########## $filename already executed ##########" >> /dev/stdout
    fi
done

# Exit to signal that the initialization is complete
echo "Initialization complete." >> /dev/stdout
exit 0
