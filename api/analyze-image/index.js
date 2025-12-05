// api/analyze-image/index.js

export default async function handler(req, res) {
  // GET → Mostrar mensaje de bienvenida
  if (req.method === "GET") {
    return res.status(200).json({
      message:
        "📡 API funcionando: envía un POST con { imageBase64 } a /api/analyze-image",
    });
  }

  // POST → Procesar imagen
  if (req.method === "POST") {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      const prompt = `
         Analiza esta imagen de un recibo.
         Devuelve un JSON con:
         - monto_total, solo el valor y separando los centavos con punto
         - 3 etiquetas que describan la imagen
         - una breve descripcion de la imagen (en maximo 10 palabras)
         Si ves USD, Total o similares, ese es el monto_total.
                                                                                                                          `;

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Missing API KEY" });
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-vision",
          input: [
            { role: "user", content: prompt },
            {
              role: "user",
              content: [
                {
                  type: "input_image",
                  image_base64: imageBase64,
                },
              ],
            },
          ],
          max_output_tokens: 500,
        }),
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Cualquier otro método
  return res.status(405).json({ error: "Method not allowed" });
}
