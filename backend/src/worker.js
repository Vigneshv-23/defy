export async function runInference(modelId) {
  console.log("🧠 Running inference for model:", modelId.toString());

  // MOCK inference (replace with real AI later)
  await new Promise(res => setTimeout(res, 2000));

  return {
    output: "cat detected with 92% confidence"
  };
}
