#!/bin/bash
echo "Starting Kafka Connect..."
/docker-entrypoint.sh &

# Wait for Kafka Connect REST API to be ready
echo "Waiting for Kafka Connect to start on port 8083..."
while ! curl -s http://localhost:8083/ > /dev/null; do
  echo "Still waiting for Kafka Connect..."
  sleep 5
done

# Wait for Kafka Connect REST API to be ready


echo "Registering SQL Server connector..."
curl -X POST -H "Content-Type: application/json" \
     --data @/kafka/connect/register-sqlserver-connector.json \
     http://localhost:8083/connectors

tail -f /dev/null

