export async function POST() {
  // Clear server memory
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
