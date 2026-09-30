/**
 * Supabase Cloud Integration for Arocha Boonlue Portfolio
 * Provides real-time synchronization between browser and Supabase PostgreSQL.
 */

const SUPABASE_CONFIG_KEY = "bumbim_supabase_config";

class SupabaseManager {
  constructor() {
    this.client = null;
    this.config = this.loadConfig();
    if (this.config.url && this.config.anonKey) {
      this.initClient(this.config.url, this.config.anonKey);
    }
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { url: "", anonKey: "", enabled: false };
  }

  saveConfig(url, anonKey, enabled = true) {
    this.config = { url: url.trim(), anonKey: anonKey.trim(), enabled };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));
    if (this.config.url && this.config.anonKey) {
      this.initClient(this.config.url, this.config.anonKey);
    }
  }

  initClient(url, anonKey) {
    if (window.supabase) {
      try {
        this.client = window.supabase.createClient(url, anonKey);
        console.log("Supabase client initialized successfully");
        return true;
      } catch (e) {
        console.error("Supabase init error:", e);
      }
    }
    return false;
  }

  isConnected() {
    return !!(this.client && this.config.url && this.config.anonKey);
  }

  // Push local data up to Supabase
  async pushData(data) {
    if (!this.isConnected()) return { success: false, error: "ไม่ได้กำหนดค่า Supabase" };

    try {
      const payload = {
        id: "main",
        data: data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await this.client
        .from("portfolio_data")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase push error:", err);
      return { success: false, error: err.message };
    }
  }

  // Fetch latest data from Supabase
  async pullData() {
    if (!this.isConnected()) return { success: false, error: "ไม่ได้กำหนดค่า Supabase" };

    try {
      const { data, error } = await this.client
        .from("portfolio_data")
        .select("data, updated_at")
        .eq("id", "main")
        .single();

      if (error) throw error;
      if (data && data.data) {
        return { success: true, data: data.data, updatedAt: data.updated_at };
      }
      return { success: false, error: "ไม่พบข้อมูลในตาราง portfolio_data" };
    } catch (err) {
      console.error("Supabase pull error:", err);
      return { success: false, error: err.message };
    }
  }
}

const portfolioSupabase = new SupabaseManager();
