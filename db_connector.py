import os
from dotenv import load_dotenv
import pathway as pw
load_dotenv()
input_rdkafka_settings = {
    "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
    "security.protocol": "plaintext",
    "group.id": os.getenv("KAFKA_GROUP_ID", "0"),
    "session.timeout.ms": "6000",
    "auto.offset.reset": "earliest",
}

MONGO_URI = os.getenv("MONGO_URI") or "your_default_mongo_uri"

class InputSchema(pw.Schema):
    value: int

if __name__ == "__main__":
    t = pw.io.debezium.read(
        input_rdkafka_settings,
        topic_name=os.getenv("DEBEZIUM_TOPIC", "mongo.test.values"),
        schema=InputSchema,
        autocommit_duration_ms=100,
    )

    t = t.reduce(sum=pw.reducers.sum(t.value))

    pw.io.mongodb.write(
        t,
        connection_string=MONGO_URI,
        database="mongo",
        collection="test",
    )

    pw.io.csv.write(t, "output_stream.csv")
    pw.run()
