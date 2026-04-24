import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let dbClient: MongoClient | null = null;
let db: Db | null = null;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Please set it in Settings (format: mongodb+srv://<user>:<password>@cluster.mongodb.net/...)");
  }

  // Handle cached connection with health check
  if (dbClient && db) {
    try {
      // Use a strict timeout for the ping to avoid hanging on stale sockets
      await Promise.race([
        db.command({ ping: 1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Ping timeout")), 3000))
      ]);
      return db;
    } catch (e) {
      console.log("MongoDB connection stale or timed out. Reconnecting...");
      try { await dbClient.close(); } catch (err) {}
      dbClient = null;
      db = null;
    }
  }

  try {
    console.log("Attempting new MongoDB connection...");
    dbClient = new MongoClient(uri, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      tls: true, // Explicitly force TLS
      family: 4, // Force IPv4 to avoid potential DNS issues with SRV in some environments
    });
    
    await dbClient.connect();
    db = dbClient.db("bilingual_chat");
    
    // Explicit ping verification
    await db.command({ ping: 1 });
    
    console.log("🚀 MongoDB Connected and Verified Successfully");
    return db;
  } catch (err: any) {
    dbClient = null;
    db = null;
    console.error("❌ MongoDB Connection Error:", err.message);
    
    // Specifically handle the SSL Alert 80 (Whitelist error)
    if (err.message.includes("alert number 80") || err.message.includes("SSL") || err.message.includes("Server selection timed out")) {
      const helpfulError = new Error(
        "NETWORK ACCESS BLOCKED: Your MongoDB Atlas cluster rejected this connection. " +
        "ACTION REQUIRED: Go to Atlas -> Network Access -> Add IP Address -> click 'ALLOW ACCESS FROM ANYWHERE' (0.0.0.0/0)."
      );
      throw helpfulError;
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check for DB
  app.get("/api/db-status", async (req, res) => {
    try {
      await getDb();
      res.json({ status: "connected", database: "bilingual_chat" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const database = await getDb();
      const conv = await database.collection("conversations").findOne({ id: req.params.id });
      if (conv) {
        res.json(conv);
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (error: any) {
      console.error("GET Conversation Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const database = await getDb();
      const conv = req.body;
      await database.collection("conversations").updateOne(
        { id: conv.id },
        { $set: conv },
        { upsert: true }
      );
      res.json(conv);
    } catch (error: any) {
      console.error("POST Conversation Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      console.log(`PATCH Conversation ${req.params.id} with updates:`, req.body);
      const database = await getDb();
      // Ensure we are searching by the custom 'id' field, not the MongoDB _id
      const result = await database.collection("conversations").findOneAndUpdate(
        { id: req.params.id },
        { $set: req.body },
        { returnDocument: 'after' }
      );
      
      if (result) {
        console.log("PATCH Success, updated document:", result);
        res.json(result);
      } else {
        console.warn(`PATCH Failed: Conversation ${req.params.id} not found`);
        res.status(404).json({ error: "Not found" });
      }
    } catch (error: any) {
      console.error("PATCH Conversation Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const database = await getDb();
      const messages = await database.collection("messages")
        .find({ convId: req.params.id })
        .sort({ createdAt: 1 })
        .toArray();
      res.json(messages);
    } catch (error: any) {
      console.error("GET Messages Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const database = await getDb();
      const msg = { 
        ...req.body, 
        createdAt: new Date().toISOString()
      };
      console.log(`Adding message to ${req.params.id}:`, msg.original, "->", msg.translated, `(to ${msg.toLang})`);
      await database.collection("messages").insertOne(msg);
      res.json(msg);
    } catch (error: any) {
      console.error("POST Message Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      await getDb();
      console.log("Database connection verified.");
    } catch (err: any) {
      console.error("Database initialization failed.");
      console.error("Reason:", err.message);
      console.error("Action Required: Set MONGODB_URI in Settings to enable database storage.");
    }
  });
}

startServer();
