// Game settings. Fill in the two Supabase values from your project's API settings.
// With both left blank the app runs in demo mode on this phone only, with no server.
window.CONFIG = {
  supabaseUrl: "https://sjtzscsgtqsgkbhrpyju.supabase.co",
  supabaseAnonKey: "sb_publishable_Eo5h4CXPjXExnXOhl-4nUA_edEgLbx_",

  // Shows demo tools (test transmission, show answers, reset). Set to false for game day.
  demoTools: true,

  // How often the navigator's phone sends its location, if the family opted in.
  locationEveryMs: 30000,
};
