export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  return new Response(JSON.stringify({ analysis: `File received: ${file.name}` }), {
    status: 200,
  });
}
