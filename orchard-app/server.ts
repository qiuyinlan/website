import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { eq } from "drizzle-orm";
import { db, projectsTable, goodStatesTable, interestsTable, mustItemsTable, prizeItemsTable, functionBoardsTable, settingsTable } from "./src/db/index.ts";
import {
  INITIAL_MAIN_PROJECTS,
  INITIAL_GOOD_STATES,
  INITIAL_INTERESTS,
  INITIAL_TODAY_MUST,
  INITIAL_GRAND_PRIZES,
  INITIAL_FUNCTION_BOARDS
} from "./src/data.ts";

// Load environment variables
dotenv.config();

const PORT = 3000;

async function seedIfNeeded() {
  console.log("Checking if PostgreSQL database seeding is needed...");
  try {
    // 1. Seed Main Projects
    const projectsExist = await db.select().from(projectsTable);
    if (projectsExist.length === 0) {
      console.log("Seeding projectsTable...");
      for (const p of INITIAL_MAIN_PROJECTS) {
        await db.insert(projectsTable).values({
          id: p.id,
          title: p.title,
          description: p.description,
          targetDate: p.targetDate,
          progress: p.progress,
          themeColor: p.themeColor,
          tasks: p.tasks,
        });
      }
    }

    // 2. Seed Good States
    const statesExist = await db.select().from(goodStatesTable);
    if (statesExist.length === 0) {
      console.log("Seeding goodStatesTable...");
      for (const gs of INITIAL_GOOD_STATES) {
        await db.insert(goodStatesTable).values({
          id: gs.id,
          title: gs.title,
          subtitle: gs.subtitle,
          entries: gs.entries,
        });
      }
    }

    // 3. Seed Interests
    const interestsExist = await db.select().from(interestsTable);
    if (interestsExist.length === 0) {
      console.log("Seeding interestsTable...");
      for (const item of INITIAL_INTERESTS) {
        await db.insert(interestsTable).values({
          id: item.id,
          content: item.content,
          dateStr: item.dateStr || null,
          isExplored: item.isExplored,
        });
      }
    }

    // 4. Seed Must Items
    const mustExist = await db.select().from(mustItemsTable);
    if (mustExist.length === 0) {
      console.log("Seeding mustItemsTable...");
      for (const m of INITIAL_TODAY_MUST) {
        await db.insert(mustItemsTable).values({
          id: m.id,
          content: m.content,
          isDone: m.isDone,
          springDewValue: m.springDewValue,
        });
      }
    }

    // 5. Seed Prize Items
    const prizesExist = await db.select().from(prizeItemsTable);
    if (prizesExist.length === 0) {
      console.log("Seeding prizeItemsTable...");
      for (const p of INITIAL_GRAND_PRIZES) {
        await db.insert(prizeItemsTable).values({
          id: p.id,
          content: p.content,
          springDewCost: p.springDewCost,
          isUnlocked: p.isUnlocked,
        });
      }
    }

    // 6. Seed Function Boards
    const boardsExist = await db.select().from(functionBoardsTable);
    if (boardsExist.length === 0) {
      console.log("Seeding functionBoardsTable...");
      for (let i = 0; i < INITIAL_FUNCTION_BOARDS.length; i++) {
        const b = INITIAL_FUNCTION_BOARDS[i];
        await db.insert(functionBoardsTable).values({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || null,
          type: b.type,
          themeColor: b.themeColor,
          customItems: b.customItems || [],
          order: i,
        });
      }
    }

    // 7. Seed Settings (spring dew points)
    const settingsExist = await db.select().from(settingsTable);
    if (settingsExist.length === 0) {
      console.log("Seeding settingsTable...");
      await db.insert(settingsTable).values({
        key: "spring_dew_points",
        value: "35",
      });
    }

    console.log("Database seed check completed successfully!");
  } catch (error) {
    console.error("Failed to seed database, continuing with server boot:", error);
  }
}

async function startServer() {
  const app = express();
  
  // Middleware
  app.use(express.json());

  // Run database self-seeding checked on boots
  await seedIfNeeded();

  // API Routes
  app.get("/api/state", async (req, res) => {
    try {
      const projects = await db.select().from(projectsTable);
      const goodStates = await db.select().from(goodStatesTable);
      const interests = await db.select().from(interestsTable);
      const mustItems = await db.select().from(mustItemsTable);
      const prizeItems = await db.select().from(prizeItemsTable);
      const fbRows = await db.select().from(functionBoardsTable);
      const functionBoards = fbRows.sort((a, b) => a.order - b.order);

      const pointsRow = await db.select().from(settingsTable).where(eq(settingsTable.key, "spring_dew_points"));
      const springDewPoints = pointsRow[0] ? Number(pointsRow[0].value) : 35;

      res.json({
        projects,
        goodStates,
        interests,
        mustItems,
        prizeItems,
        functionBoards,
        springDewPoints,
      });
    } catch (error: any) {
      console.error("Database error serving /api/state:", error);
      res.status(500).json({ error: "Database state fetch failed", details: error.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(projectsTable);
      for (const p of list) {
        await db.insert(projectsTable).values({
          id: p.id,
          title: p.title,
          description: p.description,
          targetDate: p.targetDate,
          progress: Number(p.progress || 0),
          themeColor: p.themeColor,
          tasks: p.tasks || [],
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving projects:", error);
      res.status(500).json({ error: "Failed to save projects", details: error.message });
    }
  });

  app.post("/api/good-states", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(goodStatesTable);
      for (const gs of list) {
        await db.insert(goodStatesTable).values({
          id: gs.id,
          title: gs.title,
          subtitle: gs.subtitle,
          entries: gs.entries || [],
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving good-states:", error);
      res.status(500).json({ error: "Failed to save good states", details: error.message });
    }
  });

  app.post("/api/interests", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(interestsTable);
      for (const item of list) {
        await db.insert(interestsTable).values({
          id: item.id,
          content: item.content,
          dateStr: item.dateStr || null,
          isExplored: item.isExplored,
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving interests:", error);
      res.status(500).json({ error: "Failed to save interests", details: error.message });
    }
  });

  app.post("/api/must-items", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(mustItemsTable);
      for (const m of list) {
        await db.insert(mustItemsTable).values({
          id: m.id,
          content: m.content,
          isDone: m.isDone,
          springDewValue: Number(m.springDewValue || 0),
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving must-items:", error);
      res.status(500).json({ error: "Failed to save must items", details: error.message });
    }
  });

  app.post("/api/prize-items", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(prizeItemsTable);
      for (const p of list) {
        await db.insert(prizeItemsTable).values({
          id: p.id,
          content: p.content,
          springDewCost: Number(p.springDewCost || 0),
          isUnlocked: p.isUnlocked,
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving prize-items:", error);
      res.status(500).json({ error: "Failed to save prize items", details: error.message });
    }
  });

  app.post("/api/function-boards", async (req, res) => {
    try {
      const list = req.body as any[];
      await db.delete(functionBoardsTable);
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        await db.insert(functionBoardsTable).values({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || null,
          type: b.type,
          themeColor: b.themeColor,
          customItems: b.customItems || [],
          order: i,
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving function-boards:", error);
      res.status(500).json({ error: "Failed to save function boards", details: error.message });
    }
  });

  app.post("/api/spring-dew", async (req, res) => {
    try {
      const { points } = req.body;
      await db.insert(settingsTable)
        .values({ key: "spring_dew_points", value: String(points) })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: { value: String(points) }
        });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Database error saving spring-dew:", error);
      res.status(500).json({ error: "Failed to save points", details: error.message });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Fallback handler for all requests to support client SPA routes
  app.get("*", (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      // Let Vite handle fallback in development
      return next();
    }
    const distPath = path.join(process.cwd(), "dist");
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
