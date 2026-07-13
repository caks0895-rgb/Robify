# 🟢 ROBIFY (robify.fun)

Welcome to **Robify** — the ultimate green-hoodie avatar & meme laboratory built for the **$ROBIFY / Robinhood Chain** community!

Robify features two powerful, interactive toolsets designed to help community members express themselves with custom-crafted brand assets:
1. **AI Studio (Face Overlays)**: Transforms user-uploaded selfies into custom cartoon-style portraits sporting a brand-consistent hood.
2. **AI Meme Lab (Prompt to Meme)**: Generates complete, custom high-quality meme situations featuring either the iconic green hoodie mascot, a blue-skinned **Blue Imagen** companion, or custom-themed elements from standard text descriptions.

---

## 🎨 Core Product Philosophy & Brand Identity

Robify maintains absolute aesthetic consistency through server-side prompt construction constraints:
- **The Mascot Character Lock**: Generates abstract cartoon/chibi creatures with stocky proportions, warm brown skin/fur, and soft digital-painting brush textures (no flat vector or sterile clip art).
- **Iconic Hoodie Design**: Defaults to a vibrant, signature green hoodie (`#00C805`) equipped with visible, dangling drawstrings.
- **The Blue Imagen Mode**: Instantly generates an alternative tech-vibrant blue companion creature inside a glowing, futuristic digital workspace command center.
- **Thematic Backgrounds**: Implements deep, ambient navy-blue blurred backgrounds that make the foreground subjects and expressions pop.

---

## ⚙️ Technical Architecture

Robify runs on **Next.js 15 (App Router)** and **Tailwind CSS v4** for extreme responsiveness and lightweight bundle sizes.

### The Bankr LLM Gateway Integration
All AI steps are powered exclusively by the **Bankr LLM Gateway** (`https://llm.bankr.bot/v1`) using a unified `BANKR_API_KEY`. No external Google Gemini or OpenAI client keys are required.

#### High-Efficiency Flow:
1. **AI Studio (Two-Step Vision-to-Image)**:
   - **Step 1 (Vision)**: The uploaded selfie is analyzed securely using `gemini-3-flash` on the Bankr endpoint. It creates a short, respectful facial description (expression, skin tone, hair style) in under 40 words.
   - **Step 2 (Generation)**: The resulting description is merged into the deterministic brand rules and passed to `gpt-image-2` on the `/v1/images/generations` endpoint to output a customized 1:1, high-fidelity avatar inspired by the user's features.
2. **AI Meme Lab (Dynamic Prompt Translation)**:
   - Users can choose from **Lab Presets** or write custom descriptions in **any language** (e.g., Indonesian, English, Spanish).
   - The input is parsed and translated server-side to format a detailed, brand-safe English prompt including negative constraints.
   - The image is rendered via `gpt-image-2` as a beautifully textured 1024x1024 PNG asset.

---

## 📊 Rate Limiting & Web3 Integration

To ensure optimal operations and cost control:
- **Shared Daily Quota**: Restricts basic generation to a strict limit of **3 free generations per day** per user device (persisted locally via client-side storage tracking).
- **Web3 Wallet / Base Payments Gateway**: Users can connect their Web3 wallets on the **Base network** to unlock additional manual generations. When a user runs out of free generations, a payment modal guides them to continue via small micropayments.

---

## 🛠️ Environment Configuration

Ensure that your environment includes the following variables (documented in `.env.example`):

```env
# Bankr Gateway Configuration
BANKR_LLM_BASE_URL=https://llm.bankr.bot/v1
BANKR_API_KEY=bk_your_api_key_here

# Model Selection
BANKR_TEXT_MODEL=gpt-5-nano
BANKR_IMAGE_MODEL=gpt-image-2
```

---

## 🚀 Getting Started

To run the project locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` in your root folder and supply your `BANKR_API_KEY`.

3. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

*Keep it green, keep it meme-able. Built for the community.*
