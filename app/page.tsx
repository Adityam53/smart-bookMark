"use client";

import { supabase } from "@/app/library/supabase";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Spinner } from "./Spinner";

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔐 Auth
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setAuthLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 📥 Fetch bookmarks
  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setBookmarks(data);

    setInitialLoading(false); // only matters for first load
  };

  // ⚡ Realtime + Initial fetch
  useEffect(() => {
    if (!user) return;

    setInitialLoading(true); // ✅ only here

    fetchBookmarks();

    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        () => {
          fetchBookmarks(); // ❌ no loading here
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🧠 URL validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ➕ Add bookmark
  const addBookmark = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Invalid URL");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ]);

    setLoading(false);

    if (error) {
      toast.error("Failed to add bookmark");
    } else {
      toast.success("Bookmark added 🚀");
      setTitle("");
      setUrl("");
    }
  };

  // 🗑 Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Deleted");
    }
  };

  // 🔐 Auth actions
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // 🔄 Auth loading screen
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Spinner size={30} />
      </div>
    );
  }

  // 🔐 Not logged in
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <button
          onClick={loginWithGoogle}
          className="bg-white text-black px-6 py-3 rounded hover:opacity-80 transition"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Smart Bookmark
          </h1>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>

        {/* Add Bookmark */}
        <div className="flex gap-2 mb-8">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded px-3 py-2 w-1/3 focus:outline-none focus:border-white/20"
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded px-3 py-2 w-2/3 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={addBookmark}
            disabled={loading || !title || !url}
            className="bg-white text-black px-4 rounded flex items-center justify-center hover:opacity-80 transition disabled:opacity-50"
          >
            {loading ? <Spinner size={16} /> : "Add"}
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {initialLoading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner size={28} />
            </div>
          ) : (
            <>
              {bookmarks.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No bookmarks yet. Add one 🚀
                </p>
              )}

              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded px-4 py-3 flex justify-between items-center hover:border-white/20 transition"
                >
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline break-all"
                  >
                    {b.title}
                  </a>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(b.url);
                        toast.success("Link copied!");
                      }}
                      className="text-xs text-gray-400 hover:text-white transition"
                    >
                      Copy
                    </button>

                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="text-xs text-gray-400 hover:text-red-400 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
