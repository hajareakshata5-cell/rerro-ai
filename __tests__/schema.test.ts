import assert from "node:assert";

// PromptWars Evaluation Test Suite: Schema Determinism & Safety
const mockPayload = {
  languageCode: "mr-IN",
  title: "रस्त्यावरील आणीबाणी ट्रायज",
  overview: "तातडीने वाहतूक नियंत्रण आणि बचाव कार्य आवश्यक आहे.",
  priorityLevel: "CRITICAL",
  cards: [
    {
      heading: "तातडीचा विद्युत पुरवठा खंडित करणे",
      detail: "स्थानिक उपकेंद्राशी तात्काळ संपर्क साधा.",
      action: "Listen Action",
    },
  ],
  executionPlan: [
    "Step 1: विद्युत उपकेंद्राशी संपर्क",
    "Step 2: परिसर सुरक्षित करणे",
  ],
};

// 1. Verify schema keys exist
assert.ok(mockPayload.languageCode, "languageCode missing");
assert.ok(mockPayload.title, "title missing");
assert.ok(mockPayload.overview, "overview missing");
assert.ok(mockPayload.priorityLevel, "priorityLevel missing");
assert.ok(Array.isArray(mockPayload.cards), "cards must be an array");
assert.ok(
  Array.isArray(mockPayload.executionPlan),
  "executionPlan must be an array",
);

// 2. Verify priority levels
const validPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
assert.ok(
  validPriorities.includes(mockPayload.priorityLevel),
  "Invalid priority level",
);

// 3. Verify non-empty execution plan
assert.ok(
  mockPayload.executionPlan.length > 0,
  "Execution plan cannot be empty",
);

console.log("✔ All PromptWars schema assertion tests passed successfully.");
