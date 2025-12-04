// import library
const express = require("express");
const cors = require("cors");
const unicorns = require("./data.js");

// Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/unicorns", (req, res) => {
  let results = [...unicorns];
  const {
    name,
    loves,
    weightGreaterThan,
    weightLessThan,
    vampiresGreaterThan,
    vaccinated,
    vampiresExists,
    gender,
  } = req.query;

  if (name) {
    results = results.filter(
      (u) => u.name.toLowerCase() === name.toLowerCase(),
    );
  }

  if (loves) {
    const lovesArr = loves.split(",").map((x) => x.trim());
    results = results.filter((u) =>
      lovesArr.every((love) => u.loves.includes(love)),
    );
  }

  if (weightGreaterThan) {
    results = results.filter((u) => u.weight > Number(weightGreaterThan));
  }

  if (weightLessThan) {
    results = results.filter((u) => u.weight < Number(weightLessThan));
  }

  if (vampiresGreaterThan) {
    results = results.filter((u) => u.vampires > Number(vampiresGreaterThan));
  }

  if (vaccinated) {
    const val = vaccinated === "true";
    results = results.filter((u) => u.vaccinated === val);
  }

  if (vampiresExists) {
    const exists = vampiresExists === "true";
    results = results.filter((u) =>
      exists ? u.vampires !== undefined : u.vampires === undefined,
    );
  }

  if (gender) {
    results = results.filter((u) => u.gender === gender);
  }

  res.json(results);
});

// GET
app.get("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const unicorn = unicorns.find(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (!unicorn) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  res.json(unicorn);
});

// POST
app.post("/unicorns", (req, res) => {
  const newUnicorn = req.body;

  if (!newUnicorn.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const exists = unicorns.some(
    (u) => u.name.toLowerCase() === newUnicorn.name.toLowerCase(),
  );
  if (exists) {
    return res.status(409).json({ error: "Unicorn already exists" });
  }

  newUnicorn._id = Date.now().toString();
  unicorns.push(newUnicorn);

  res.status(201).json(newUnicorn);
});

// PUT
app.put("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicorns.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  unicorns[index] = { ...unicorns[index], ...req.body };

  res.json(unicorns[index]);
});

// DELETE
app.delete("/unicorns/:name", (req, res) => {
  const name = req.params.name;
  const index = unicorns.findIndex(
    (u) => u.name.toLowerCase() === name.toLowerCase(),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Unicorn not found" });
  }

  const deleted = unicorns.splice(index, 1)[0];
  res.json({ message: "Unicorn deleted", unicorn: deleted });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Unicorn API running on port ${PORT}`));
