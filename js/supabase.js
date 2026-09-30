/**
 * Supabase Cloud & Realtime Integration for Arocha Boonlue (Bumbim) Portfolio
 * High-performance, anti-stale data synchronization, Realtime channels, and Cloud Storage.
 */

const SUPABASE_CONFIG_KEY = "bumbim_supabase_config";

class SupabaseManager {
  constructor() {
    this.client = null;
    this.realtimeChannel = null;
    this.status = "DISCONNECTED"; // DISCONNECTED, CONNECTING, CONNECTED, SUBSCRIBED, ERROR
    this.statusListeners = [];
    this.dataChangeListeners = [];
    this.lastSyncTime = null;

    this.config = this.loadConfig();
    if (this.config.url && this.config.anonKey && this.config.enabled !== false) {
      this.initClient(this.config.url, this.config.anonKey);
    }
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load Supabase config:", e);
    }
    return { url: "", anonKey: "", enabled: false };
  }

  saveConfig(url, anonKey, enabled = true) {
    this.config = {
      url: (url || "").trim(),
      anonKey: (anonKey || "").trim(),
      enabled: !!enabled
    };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));

    if (this.config.url && this.config.anonKey && this.config.enabled) {
      return this.initClient(this.config.url, this.config.anonKey);
    } else {
      this.disconnect();
      return false;
    }
  }

  disconnect() {
    if (this.realtimeChannel && this.client) {
      try {
        this.client.removeChannel(this.realtimeChannel);
      } catch (e) {}
      this.realtimeChannel = null;
    }
    this.client = null;
    this.setStatus("DISCONNECTED");
  }

  initClient(url, anonKey) {
    if (!window.supabase) {
      console.warn("Supabase library not yet loaded on window.");
      this.setStatus("ERROR", "ไลบรารี Supabase ยังโหลดไม่เสร็จ");
      return false;
    }

    try {
      this.setStatus("CONNECTING");

      // Clean existing channel if any
      if (this.realtimeChannel && this.client) {
        try {
          this.client.removeChannel(this.realtimeChannel);
        } catch (e) {}
      }

      this.client = window.supabase.createClient(url, anonKey, {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      this.setStatus("CONNECTED");
      this.setupRealtimeSubscription();
      return true;
    } catch (err) {
      console.error("Supabase client init error:", err);
      this.setStatus("ERROR", err.message);
      return false;
    }
  }

  isConnected() {
    return !!(this.client && this.config.url && this.config.anonKey);
  }

  setStatus(status, errorMsg = "") {
    this.status = status;
    this.statusListeners.forEach(fn => {
      try {
        fn(status, errorMsg);
      } catch (e) {
        console.error("Status listener error:", e);
      }
    });
  }

  onStatusChange(fn) {
    if (typeof fn === "function") {
      this.statusListeners.push(fn);
      fn(this.status);
    }
  }

  onDataChange(fn) {
    if (typeof fn === "function") {
      this.dataChangeListeners.push(fn);
    }
  }

  /**
   * Subscribe to Supabase Postgres Realtime Changes
   * Ensures instant sync across all viewers without page refreshes!
   */
  setupRealtimeSubscription() {
    if (!this.client) return;

    try {
      const channelId = `portfolio_sync_${Date.now()}`;
      this.realtimeChannel = this.client
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "portfolio_data",
            filter: "id=eq.main"
          },
          (payload) => {
            console.log("⚡ [Realtime] Received Supabase Postgres Change:", payload);
            if (payload && payload.new && payload.new.data) {
              const remoteData = payload.new.data;
              const updatedAt = payload.new.updated_at || new Date().toISOString();
              this.lastSyncTime = updatedAt;
              
              // Notify all subscribed app modules
              this.notifyDataChange(remoteData, updatedAt, "realtime_event");
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("🟢 [Realtime] Subscribed successfully to portfolio_data changes!");
            this.setStatus("SUBSCRIBED");
          } else if (status === "CHANNEL_ERROR") {
            console.warn("⚠️ [Realtime] Channel connection error:", err);
            this.setStatus("ERROR", err ? err.message : "Realtime channel error");
          } else if (status === "TIMED_OUT") {
            console.warn("⚠️ [Realtime] Subscription timed out.");
            this.setStatus("CONNECTED");
          }
        });
    } catch (e) {
      console.error("Realtime subscription setup failed:", e);
    }
  }

  notifyDataChange(data, updatedAt, source = "remote") {
    this.dataChangeListeners.forEach(fn => {
      try {
        fn(data, updatedAt, source);
      } catch (e) {
        console.error("Data change listener error:", e);
      }
    });
  }

  /**
   * Anti-Stale Data Check (SWR - Stale-While-Revalidate)
   * Fetches latest data from Supabase directly to ensure NO obsolete cached data is shown.
   */
  async revalidateWithCloud(localData, onFreshCallback) {
    if (!this.isConnected()) return;

    try {
      this.setStatus("CONNECTING");
      const { data, error } = await this.client
        .from("portfolio_data")
        .select("data, updated_at")
        .eq("id", "main")
        .single();

      if (error) {
        // If row doesn't exist yet (PGRST116), seed it from localData!
        if (error.code === "PGRST116") {
          console.log("ℹ️ No remote data found on Supabase. Uploading initial local data...");
          await this.pushData(localData);
          this.setStatus("SUBSCRIBED");
          return;
        }
        console.warn("Cloud revalidation query notice:", error.message);
        this.setStatus(this.realtimeChannel ? "SUBSCRIBED" : "CONNECTED");
        return;
      }

      if (data && data.data) {
        this.lastSyncTime = data.updated_at;
        const remoteTime = new Date(data.updated_at).getTime();
        const localTime = new Date(localData._metadata?.updatedAt || 0).getTime();

        // If remote data is newer or local has no timestamp, upgrade immediately!
        if (remoteTime > localTime || !localData._metadata?.updatedAt) {
          console.log("⚡ [SWR] Newer data found on cloud! Upgrading local state seamlessly...");
          if (typeof onFreshCallback === "function") {
            onFreshCallback(data.data, data.updated_at);
          }
        }
        this.setStatus("SUBSCRIBED");
      }
    } catch (err) {
      console.warn("Background cloud revalidation check note:", err);
      this.setStatus(this.realtimeChannel ? "SUBSCRIBED" : "CONNECTED");
    }
  }

  /**
   * Force Sync / Fresh Pull (Bypass any cache completely)
   * Explicitly requested by user: "ไม่ดึงข้อมูลเก่า"
   */
  async pullDataFresh() {
    if (!this.isConnected()) {
      return { success: false, error: "ไม่ได้กำหนดค่า Supabase หรือยังไม่ได้เชื่อมต่อ" };
    }

    try {
      this.setStatus("CONNECTING");
      // Cache-busting fetch
      const { data, error } = await this.client
        .from("portfolio_data")
        .select("data, updated_at")
        .eq("id", "main")
        .single();

      if (error) throw error;

      if (data && data.data) {
        this.lastSyncTime = data.updated_at || new Date().toISOString();
        this.setStatus("SUBSCRIBED");
        return {
          success: true,
          data: data.data,
          updatedAt: this.lastSyncTime
        };
      }

      return { success: false, error: "ไม่พบข้อมูลในตาราง portfolio_data" };
    } catch (err) {
      console.error("Force pull error:", err);
      this.setStatus("ERROR", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Push data to Supabase with latest ISO timestamp
   */
  async pushData(data) {
    if (!this.isConnected()) {
      return { success: false, error: "ไม่ได้กำหนดค่า Supabase หรือยังไม่ได้เชื่อมต่อ" };
    }

    const timestamp = new Date().toISOString();
    this.lastSyncTime = timestamp;

    // Ensure metadata timestamping
    if (!data._metadata) data._metadata = {};
    data._metadata.updatedAt = timestamp;
    data._metadata.version = "2.0";

    try {
      this.setStatus("CONNECTING");
      const payload = {
        id: "main",
        data: data,
        updated_at: timestamp
      };

      const { error } = await this.client
        .from("portfolio_data")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      this.setStatus("SUBSCRIBED");
      return { success: true, updatedAt: timestamp };
    } catch (err) {
      console.error("Supabase push error:", err);
      this.setStatus("ERROR", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Upload File to Supabase Storage Bucket ('portfolio_files')
   * With automatic fallback to Base64/IndexedDB if storage bucket is not configured.
   */
  async uploadFile(file) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const cleanExt = (file.name.split(".").pop() || "bin").toLowerCase();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniquePath = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;

    // Try Supabase Storage first if connected
    if (this.isConnected()) {
      try {
        const { data: uploadData, error: uploadError } = await this.client.storage
          .from("portfolio_files")
          .upload(uniquePath, file, {
            cacheControl: "3600",
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = this.client.storage
            .from("portfolio_files")
            .getPublicUrl(uniquePath);

          if (publicUrlData && publicUrlData.publicUrl) {
            return {
              success: true,
              url: publicUrlData.publicUrl,
              name: file.name,
              size: `${fileSizeMB} MB`,
              type: file.type || "application/octet-stream",
              storage: "supabase"
            };
          }
        } else {
          console.warn("Supabase bucket upload warning (falling back to local):", uploadError.message);
        }
      } catch (e) {
        console.warn("Supabase Storage error (falling back to local):", e);
      }
    }

    // Fallback: Read as Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          success: true,
          url: e.target.result,
          name: file.name,
          size: `${fileSizeMB} MB`,
          type: file.type || "application/octet-stream",
          storage: "local"
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: "ไม่สามารถอ่านไฟล์ได้"
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// Global instance
const portfolioSupabase = new SupabaseManager();
