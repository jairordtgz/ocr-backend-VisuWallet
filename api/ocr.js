export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ message: "OCR endpoint working" });
  }

  try {
    console.log("Body recibido:", req.body);

    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error("Falta GOOGLE_CLOUD_VISION_API_KEY");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              { type: "DOCUMENT_TEXT_DETECTION" },
              { type: "LABEL_DETECTION", maxResults: 5}
            ],
          },
        ],
      }
    );

    const resData = response.data.responses[0];

    const text =
      response.data.responses[0]?.fullTextAnnotation?.text ||
      response.data.responses[0]?.textAnnotations?.[0]?.description ||
      "";


    const labels =
      (resData?.labelAnnotations || []).map((l) => l.description).slice(0, 5);

    
    const amountMatch = text.match(/\$?\s*(\d+[.,]\d{2}|\d+)/);

    
    const dateMatch = text.match(
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/
    );

    return res.status(200).json({
      rawText: text,
      amount: amountMatch ? amountMatch[1].replace(",", ".") : "",
      date: dateMatch ? dateMatch[1] : "",
      labels
    });
  } catch (err) {
    console.error("OCR Error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "OCR failed",
      details: err.response?.data || err.message,
    });
  }
}
