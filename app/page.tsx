"use client";

import { supabase } from "@/app/library/supabase";
import { useEffect, useState } from "react";

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

  // 🔐 Auth
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
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

    if (!error) setBookmarks(data);
  };

  useEffect(() => {
    if (!user) return;

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
        (payload) => {
          console.log("REALTIME EVENT:", payload);
          fetchBookmarks();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ➕ Add bookmark
  const addBookmark = async () => {
    if (!title || !url) return;

    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ]);

    setTitle("");
    setUrl("");
    // fetchBookmarks(); //not needed after applying real-time updates.
  };

  // 🗑 Delete bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    // fetchBookmarks(); //not needed after applying real-time updates.
  };

  // 🔐 Auth actions
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button
          onClick={loginWithGoogle}
          className="bg-black text-white px-6 py-3 rounded"
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
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 w-1/3 focus:outline-none focus:border-zinc-600"
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 w-2/3 focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={addBookmark}
            className="bg-white text-black px-4 rounded hover:opacity-80 transition"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {bookmarks.length === 0 && (
            <p className="text-gray-500 text-sm">
              No bookmarks yet. Add one 🚀
            </p>
          )}

          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="bg-zinc-900 border border-zinc-800 rounded px-4 py-3 flex justify-between items-center hover:border-zinc-600 transition"
            >
              <a
                href={b.url}
                target="_blank"
                className="text-sm hover:underline break-all"
              >
                {b.title}
              </a>

              <button
                onClick={() => deleteBookmark(b.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
