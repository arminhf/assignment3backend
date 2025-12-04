// Import library
const express = require("express");
const cors = require("cors");
// Do not need. switching to array
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const Unicorn = require("./models/Unicorns.js");
// dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Import data
const { unicorns } = require("./data.js");
// Create mutable copy
let unicornsData = [...unicorns];

// Helper
function filterUnicorns(query) {
  return unicornsData.filter((unicorn) => {
    // Names
    if (
      query.name &&
      !unicorn.name.toLowerCase().includes(query.name.toLowerCase())
    ) {
      return false;
    }

    // Loves
    if (query.loves) {
      const lovesArray = query.loves
        .split(",")
        .map((item) => item.trim().toLowerCase());
      const unicornsLoves = unicorn.loves.map((l) => l.toLowerCase());

      if (!lovesArray.every((love) => unicornsLoves.includes(love))) {
        return false;
      }
    }
    // gender
    if (query.gender) {
      let genderFilter = query.gender.toLowerCase();
      if (genderFilter === "male") genderFilter = "m";
      if (genderFilter === "female") genderFilter = "f";

      if (unicorn.gender.toLowerCase() !== genderFilter) {
        return false;
      }
    }

    // weightGreaterThan
    if (
      query.weightGreaterThan &&
      unicorn.weight <= parseFloat(query.weightGreaterThan)
    ) {
      return false;
    }

    // weightLessThan
    if (
      query.weightLessThan &&
      unicorn.weight >= parseFloat(query.weightLessThan)
    ) {
      return false;
    }

    // vampiresExists
    if (query.vampiresExists !== undefined) {
      const hasVampires = unicorn.vampires !== undefined;
      if (query.vampiresExists === "true" && !hasVampires) return false;
      if (query.vampiresExists === "false" && hasVampires) return false;
    }

    // vampiresGreaterThan
    if (
      query.vampiresGreaterThan &&
      (!unicorn.vampires ||
        unicorn.vampires <= parseInt(query.vampiresGreaterThan))
    ) {
      return false;
    }

    // vaccinated
    if (query.vaccinated !== undefined) {
      if (query.vaccinated === "true" && !unicorn.vaccinated) return false;
      if (query.vaccinated === "false" && unicorn.vaccinated) return false;
    }

    return true;
  });
}

// GET
app.get("/unicorns", (req, res) => {
  try {
    const filteredUnicorns = filterUnicorns(req.query);
    res.json(filteredUnicorns);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /unicorns/:name - Retrieve single unicorn by name
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

// POST
app.post("/unicorns", (req, res) => {
  try {
    const { name, dob, loves, weight, vampires, gender, vaccinated } = req.body;

    // Validate
    if (
      !name ||
      !dob ||
      !loves ||
      weight === undefined ||
      gender === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check
    if (unicornsData.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return res
        .status(409)
        .json({ error: "Unicorn with this name already exists" });
    }

    const newUnicorn = {
      _id: Date.now().toString(), // Simple ID generation
      name,
      dob: new Date(dob).toISOString(),
      loves: Array.isArray(loves) ? loves : [loves],
      weight: parseFloat(weight),
      vampires: vampires ? parseInt(vampires) : undefined,
      gender,
      vaccinated: vaccinated !== undefined ? Boolean(vaccinated) : true,
    };

    unicornsData.push(newUnicorn);
    res.status(201).json(newUnicorn);
  } catch (error) {
    res.status(400).json({ error: "Invalid data format" });
  }
});

// PUT
app.put("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicornsData.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  try {
    const { dob, loves, weight, vampires, gender, vaccinated } = req.body;

    // Update
    if (dob) unicornsData[index].dob = new Date(dob).toISOString();
    if (loves)
      unicornsData[index].loves = Array.isArray(loves) ? loves : [loves];
    if (weight !== undefined) unicornsData[index].weight = parseFloat(weight);
    if (vampires !== undefined)
      unicornsData[index].vampires = parseInt(vampires);
    if (gender) unicornsData[index].gender = gender;
    if (vaccinated !== undefined)
      unicornsData[index].vaccinated = Boolean(vaccinated);

    res.json(unicornsData[index]);
  } catch (error) {
    res.status(400).json({ error: "Invalid data format" });
  }
});

// DELETE
app.delete("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicornsData.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  const deletedUnicorn = unicornsData.splice(index, 1)[0];
  res.json({
    message: "Unicorn deleted successfully",
    unicorn: deletedUnicorn,
  });
});

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Unicorn API is running!" });
});

// Starting server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
