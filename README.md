---

# 🔄 SQL Server to PostgreSQL Real-Time Sync with Debezium, Kafka, and Node.js

> **Real-time Change Data Capture (CDC)** between SQL Server and PostgreSQL using Debezium, Kafka, and a Node.js consumer.

---

## 📌 Project Overview

This project sets up a real-time data pipeline that **syncs changes from a SQL Server `users` table to a PostgreSQL `users` table**. It uses:

* **Debezium** to capture change events from SQL Server.
* **Kafka** to transport those change events.
* **Node.js** to consume the Kafka stream and apply changes to PostgreSQL.

✅ Supports `INSERT`, `UPDATE`, and `DELETE` operations.

---

## 🧱 Architecture

```
SQL Server (source DB)
    │
    ▼
[Debezium Connector] → Kafka Topic (sqlserver.dbo.users)
    │
    ▼
[Node.js Consumer] → PostgreSQL (target DB)
```

---

## 🐳 Services (via Docker Compose)

| Service     | Role                               |
| ----------- | ---------------------------------- |
| `zookeeper` | Kafka coordination                 |
| `kafka`     | Message broker                     |
| `sqlserver` | Source database                    |
| `postgres`  | Target database                    |
| `connect`   | Debezium Kafka Connect service     |
| `node-sync` | Kafka consumer to sync to Postgres |
| `kafka-ui`  | Kafka monitoring UI                |

---

## 🚀 Getting Started

### 🔧 Prerequisites

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)
* Unix/Linux/macOS or WSL (for `bash` script compatibility)

---

### 🛠 Setup Instructions

1. **Clone the repo**

```bash
git clone https://github.com/thisisamr/sqlserver-to-postgres-sync.git
cd sqlserver-to-postgres-sync
```

2. **Start all services**

```bash
docker compose up --build
```

> 💡 This boots up all services and initializes the SQL Server and Postgres databases.

3. **Register the Debezium Connector**

Once the containers are up, run:

```bash
curl -X POST -H "Content-Type: application/json" \
    --data @debezium/register-sqlserver-connector.json \
    http://localhost:8083/connectors
```

This registers the Debezium SQL Server connector to watch changes on the `users` table.

---

## 📝 Table Schema

### SQL Server (`testdb.dbo.users`)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name NVARCHAR(100),
  email NVARCHAR(100)
);
```

### PostgreSQL (`testdb.public.users`)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);
```

> ✅ `ON CONFLICT (id) DO NOTHING` is used for inserts to prevent duplication.

---

## 🧠 How It Works

* Changes in SQL Server are picked up by **Debezium**.
* Debezium writes them as JSON messages to a Kafka topic: `sqlserver.dbo.users`.
* The **Node.js app** consumes this topic and applies the corresponding insert/update/delete to the Postgres table.

Sample Debezium message:

```json
{
  "payload": {
    "op": "c",
    "after": { "id": 1, "name": "Alice", "email": "alice@example.com" },
    "before": null
  }
}
```

---

## 🔍 Monitoring

### 📊 Kafka UI

Visit: [http://localhost:8080](http://localhost:8080)
Use it to inspect Kafka topics, offsets, and messages.

### 🐘 PostgreSQL

```bash
docker exec -it postgres psql -U postgres -d testdb
SELECT * FROM users;
```

---

## 📂 File Structure

```
├── docker-compose.yml
├── debezium/
│   └── register-sqlserver-connector.json
├── init/
│   ├── init.sql             # SQL Server table init
│   └── init-pg-db/          # Postgres init scripts
├── node-sync/
│   ├── Dockerfile
│   └── index.js             # Kafka consumer logic
└── connect-entrypoint.sh    # Optional auto-registration
```

---

## 🧪 Testing It

1. Connect to SQL Server:

```bash
docker exec -it sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourStrong!Passw0rd'
```

2. Insert data:

```sql
USE testdb;
INSERT INTO users (id, name, email) VALUES (10, 'Test User', 'test@sync.io');
```

3. Watch `node-sync` logs:

```bash
docker compose logs -f node-sync
```

4. Check PostgreSQL:

```bash
SELECT * FROM users;
```

---

## 💻 Local Development

The Node.js app is in `node-sync/`. It's a simple Kafka consumer that connects to Postgres and syncs messages.

```bash
cd node-sync
npm install
node index.js
```

Environment variables:

* `KAFKA_BROKER=kafka:9092`
* `POSTGRES_URL=postgres://postgres:postgres@postgres:5432/testdb`

---

## 🧹 Cleanup

```bash
docker compose down -v
```

---

## 📃 License

MIT – Feel free to fork and extend!

---

## 🙌 Acknowledgments

* [Debezium](https://debezium.io/)
* [KafkaJS](https://kafka.js.org/)
* [Confluent Kafka Images](https://hub.docker.com/r/confluentinc/)
* [Provectus Kafka UI](https://github.com/provectus/kafka-ui)

---
