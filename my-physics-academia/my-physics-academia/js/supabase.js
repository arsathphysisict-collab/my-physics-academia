const SUPABASE_URL = "https://dyemiusipuskdgknuzzj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JrPbPTWbnTD1Sn5PeANQtw_Nj9bzCGL";

// Keep the administrator session separate from the student session.
// This allows an admin and a student account to remain signed in
// independently in the same browser without overwriting each other's tokens.
// Vercel clean URLs serve admin.html at /admin, so support both paths.
const currentPath = window.location.pathname.replace(/\/$/, "");
const isAdminPage = currentPath === "/admin.html" || currentPath === "/admin";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    isAdminPage
        ? { auth: { storageKey: "mpa-admin-auth" } }
        : {}
);
