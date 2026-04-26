import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./public-env";

export const createClient = () =>
  createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
