import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Create admin user
const { data: userData, error: userError } = await supabase.auth.admin.createUser({
  email: "analista.ericksilva@gmail.com",
  password: "Admin@2026",
  email_confirm: true,
  user_metadata: { full_name: "Administrador" }
});

if (userError) {
  console.error("Error creating user:", userError.message);
  Deno.exit(1);
}

const userId = userData.user.id;
console.log("Admin user created:", userId);

// Update profile to approved
const { error: profileError } = await supabase
  .from("profiles")
  .update({ status: "approved", full_name: "Administrador" })
  .eq("user_id", userId);

if (profileError) console.error("Profile update error:", profileError.message);

// Add admin role
const { error: roleError } = await supabase
  .from("user_roles")
  .insert({ user_id: userId, role: "admin" });

if (roleError) console.error("Role error:", roleError.message);

console.log("Admin setup complete!");
