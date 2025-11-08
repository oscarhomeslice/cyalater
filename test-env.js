// test-env.js
console.log('Testing environment variables...\n');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');
console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('TripAdvisor Key:', process.env.TRIPADVISOR_API_KEY ? '✅ Loaded' : '❌ Missing');
