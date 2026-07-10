const apiKey = process.env.BANKR_API_KEY;
if (!apiKey) {
  console.error("BANKR_API_KEY is not defined");
  process.exit(1);
}

fetch("https://llm.bankr.bot/v1/models", {
  headers: {
    "X-API-Key": apiKey
  }
})
.then(res => res.json())
.then(data => {
  if (data.data) {
    const list = data.data.map(m => ({ id: m.id, name: m.name, owned_by: m.owned_by, pricing: m.pricing }));
    console.log(JSON.stringify(list, null, 2));
  } else {
    console.log("Raw data:", data);
  }
})
.catch(err => {
  console.error("Error:", err);
});
