// server.js - Fixed version
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Import data - FIXED
// Method 1: If data.js exports the array directly
const unicorns = require("./data.js");

// Method 2: If data.js exports { unicorns }
// const { unicorns } = require("./data.js");

// Create mutable copy
let unicornsData = [...unicorns];

console.log(`Server started with ${unicornsData.length} initial unicorns`);

// Helper function
function filterUnicorns(query) {
  let filtered = [...unicornsData];

  // Name filter
  if (query.name) {
    filtered = filtered.filter((u) =>
      u.name.toLowerCase().includes(query.name.toLowerCase()),
    );
  }

  // Loves filter
  if (query.loves) {
    const lovesArray = query.loves
      .split(",")
      .map((item) => item.trim().toLowerCase());
    filtered = filtered.filter((u) => {
      const unicornLoves = u.loves.map((l) => l.toLowerCase());
      return lovesArray.every((love) => unicornLoves.includes(love));
    });
  }

  // Gender filter
  if (query.gender) {
    let genderFilter = query.gender.toLowerCase();
    if (genderFilter === "male") genderFilter = "m";
    if (genderFilter === "female") genderFilter = "f";

    filtered = filtered.filter((u) => u.gender.toLowerCase() === genderFilter);
  }

  // Weight filters
  if (query.weightGreaterThan) {
    filtered = filtered.filter(
      (u) => u.weight > parseFloat(query.weightGreaterThan),
    );
  }

  if (query.weightLessThan) {
    filtered = filtered.filter(
      (u) => u.weight < parseFloat(query.weightLessThan),
    );
  }

  // Vampires exists
  if (query.vampiresExists !== undefined) {
    const wantsExists = query.vampiresExists === "true";
    filtered = filtered.filter((u) =>
      wantsExists ? u.vampires !== undefined : u.vampires === undefined,
    );
  }

  // Vampires greater than
  if (query.vampiresGreaterThan) {
    filtered = filtered.filter(
      (u) => u.vampires && u.vampires > parseInt(query.vampiresGreaterThan),
    );
  }

  // Vaccinated filter
  if (query.vaccinated !== undefined) {
    const wantsVaccinated = query.vaccinated === "true";
    filtered = filtered.filter((u) => u.vaccinated === wantsVaccinated);
  }

  return filtered;
}

// Routes
app.get("/unicorns", (req, res) => {
  try {
    const filtered = filterUnicorns(req.query);
    res.json(filtered);
  } catch (error) {
    console.error("Error filtering unicorns:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

app.get("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const unicorn = unicornsData.find(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (!unicorn) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  res.json(unicorn);
});

app.post("/unicorns", (req, res) => {
  try {
    const {
      name,
      dob,
      loves,
      weight,
      vampires,
      gender,
      vaccinated = true,
    } = req.body;

    // Validation
    if (!name || !dob || !loves || weight === undefined || !gender) {
      return res.status(400).json({
        error:
          "Missing required fields: name, dob, loves, weight, and gender are required",
      });
    }

    // Check for duplicate
    const exists = unicornsData.some(
      (u) => u.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      return res
        .status(409)
        .json({ error: "A unicorn with this name already exists" });
    }

    // Create new unicorn
    const newUnicorn = {
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      dob: new Date(dob).toISOString(),
      loves: Array.isArray(loves) ? loves : [loves],
      weight: parseFloat(weight),
      vampires: vampires ? parseInt(vampires) : undefined,
      gender: gender.toLowerCase(),
      vaccinated: Boolean(vaccinated),
    };

    unicornsData.push(newUnicorn);
    console.log(`Created new unicorn: ${name}`);

    res.status(201).json(newUnicorn);
  } catch (error) {
    console.error("Error creating unicorn:", error);
    res
      .status(400)
      .json({ error: "Invalid data format", details: error.message });
  }
});

app.put("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicornsData.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  try {
    const unicorn = unicornsData[index];
    const { dob, loves, weight, vampires, gender, vaccinated } = req.body;

    // Update fields if provided
    if (dob) unicorn.dob = new Date(dob).toISOString();
    if (loves) unicorn.loves = Array.isArray(loves) ? loves : [loves];
    if (weight !== undefined) unicorn.weight = parseFloat(weight);
    if (vampires !== undefined) {
      unicorn.vampires = vampires === "" ? undefined : parseInt(vampires);
    }
    if (gender) unicorn.gender = gender.toLowerCase();
    if (vaccinated !== undefined) unicorn.vaccinated = Boolean(vaccinated);

    console.log(`Updated unicorn: ${name}`);
    res.json(unicorn);
  } catch (error) {
    console.error("Error updating unicorn:", error);
    res
      .status(400)
      .json({ error: "Invalid data format", details: error.message });
  }
});

app.delete("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicornsData.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  const deleted = unicornsData.splice(index, 1)[0];
  console.log(`Deleted unicorn: ${name}`);

  res.json({
    message: "Unicorn deleted successfully",
    unicorn: deleted,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    unicornCount: unicornsData.length,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Unicorn API is running.",
    endpoints: {
      getAll: "GET /unicorns",
      getOne: "GET /unicorns/:name",
      create: "POST /unicorns",
      update: "PUT /unicorns/:name",
      delete: "DELETE /unicorns/:name",
      health: "GET /health",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Initial data loaded: ${unicornsData.length} unicorns`);
});
