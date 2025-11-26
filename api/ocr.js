import axios from "axios";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    // Intentamos leer el body como JSON
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }
    );

    const text = response.data.responses[0]?.fullTextAnnotation?.text || "";

    const amountMatch = text.match(/\$?\s*(\d+[.,]\d{2}|\d+)/);
    const dateMatch = text.match(/(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/);

    return res.status(200).json({
      rawText: text,
      amount: amountMatch ? amountMatch[1].replace(",", ".") : "",
      date: dateMatch ? dateMatch[1] : new Date().toString(),
    });

  } catch (error) {
    console.error("OCR Server Error:", error);
    return res.status(500).json({
      error: "OCR failed",
      details: String(error),
    });
  }
}
