const { Kafka } = require("kafkajs");
const { Client } = require("pg");

const kafka = new Kafka({
  clientId: "sync-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const pg = new Client({
  connectionString:
    process.env.POSTGRES_URL ||
    "postgres://postgres:postgres@localhost:5432/testdb",
});

(async () => {
  try {
    console.log("🔌 Connecting to PostgreSQL...");
    await pg.connect();
    console.log("✅ Connected to PostgreSQL");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  }

  const consumer = kafka.consumer({ groupId: "sync-group" });

  try {
    console.log("🔌 Connecting to Kafka...");
    await consumer.connect();
    console.log("✅ Connected to Kafka");
  } catch (err) {
    console.error("❌ Kafka connection failed:", err.message);
    process.exit(1);
  }

  await consumer.subscribe({
    topic: "sqlserver.testdb.dbo.users",
    fromBeginning: true,
  });

  console.log("👂 Subscribed to topic: sqlserver.dbo.users");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      console.log("📨 New message received:");
      console.log("📦 Topic:", topic);
      console.log("🧩 Partition:", partition);
      console.log("📝 Raw message:", rawValue);

      let event;
      try {
        event = JSON.parse(rawValue);
      } catch (err) {
        console.error("❌ Failed to parse message JSON:", err.message);
        return;
      }

      const payload = event.payload;
      if (!payload) {
        console.warn("⚠️ No payload in message. Skipping.");
        return;
      }

      const { op, after, before } = payload;
      console.log("🧠 Operation Type:", op);
      console.log("📊 After:", after);
      console.log("🗑️ Before:", before);

      try {
        if (op === "c") {
          console.log("🟢 INSERT operation detected");
          await pg.query(
            "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
            [after.id, after.name, after.email],
          );
          console.log("✅ Inserted new record into PostgreSQL");
        } else if (op === "u") {
          console.log("🟡 UPDATE operation detected");
          await pg.query(
            "UPDATE users SET name = $1, email = $2 WHERE id = $3",
            [after.name, after.email, after.id],
          );
          console.log("✅ Updated record in PostgreSQL");
        } else if (op === "d") {
          console.log("🔴 DELETE operation detected");
          await pg.query("DELETE FROM users WHERE id = $1", [before.id]);
          console.log("✅ Deleted record from PostgreSQL");
        } else {
          console.warn("⚠️ Unknown operation type:", op);
        }
      } catch (err) {
        console.error("❌ Error applying change:", err.message);
        console.error("🧾 Stack trace:", err.stack);
        console.error(
          "📦 Payload that caused error:",
          JSON.stringify(payload, null, 2),
        );
      }
    },
  });

  // Graceful shutdown on SIGINT or unhandled error
  process.on("SIGINT", async () => {
    console.log("🔻 Disconnecting from Kafka and PostgreSQL...");
    await consumer.disconnect();
    await pg.end();
    process.exit();
  });

  process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Rejection:", err);
    process.exit(1);
  });

  process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    process.exit(1);
  });
})();
