const apiKey = process.env.BANKR_API_KEY;
if (!apiKey) {
  console.error("BANKR_API_KEY is not defined");
  process.exit(1);
}

// Probe /v1/images/generations
fetch("https://llm.bankr.bot/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify({
    model: "flux-schnell",
    prompt: "a cute kitten",
    n: 1,
    size: "1024x1024"
  })
})
.then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response text:", text);
})
.catch(err => {
  console.error("Error:", err);
});
