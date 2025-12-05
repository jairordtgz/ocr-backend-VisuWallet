export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        message: "📡 API funcionando: /api/analyze-image/route — envía un POST con { imageBase64 }",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64" }), { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API KEY" }), { status: 500 });
    }

    const prompt = `
      Analiza esta imagen de un recibo.
      Devuelve un JSON con:
      - monto_total
      - 3 etiquetas
      - texto_extraido
    `;

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
            content: [{ type: "input_image", image_url: imageBase64 }],
          },
        ],
        max_output_tokens: 500,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
